"""Current-project batch generation using the installed script's configuration.

The supplied PowerShell/Python scripts and installed model files are unchanged.
"""
import argparse
import gc
import json
import os
from pathlib import Path
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

parser=argparse.ArgumentParser()
parser.add_argument('--plan',required=True)
parser.add_argument('--root',required=True)
parser.add_argument('--threads',type=int,default=4)
parser.add_argument('--workers',type=int,default=1)
parser.add_argument('--max-new',type=int,default=8)
args=parser.parse_args()
plan=json.loads(Path(args.plan).read_text(encoding='utf-8'))
total=len(plan)
jobs=[(n,item) for n,item in enumerate(plan,1) if not Path(item['output']).exists()]
if args.max_new>0: jobs=jobs[:args.max_new]
if not jobs:
    print(f'COMPLETE: {total} audio clips are ready.',flush=True)
    raise SystemExit(0)
root=Path(args.root).resolve()
os.chdir(root)
sys.path.insert(0,str(root))
sys.path.insert(0,str(root/'third_party/Matcha-TTS'))
os.environ.setdefault('HF_HOME',str(root/'.cache/huggingface'))
os.environ['PYTHONUTF8']='1'
os.environ['COSYVOICE_DISABLE_TEXT_FRONTEND']='1'
os.environ['LRU_CACHE_CAPACITY']='1'
os.environ['ONEDNN_PRIMITIVE_CACHE_CAPACITY']='1'
os.environ['DNNL_PRIMITIVE_CACHE_CAPACITY']='1'

import torch
import soundfile as sf
from cosyvoice.cli.cosyvoice import AutoModel
torch.set_num_threads(args.threads)
print('Loading one CosyVoice 3 model for the complete batch...',flush=True)
model=AutoModel(model_dir=str(root/'pretrained_models/Fun-CosyVoice3-0.5B'),fp16=False)
prompt='You are a helpful assistant.<|endofprompt|>希望你以后能够做的比我还好呦。'
prompt_wav=str(root/'asset/zero_shot_prompt.wav')
# Use the model's supported in-memory cache for the same original prompt.
model.add_zero_shot_spk(plan[0]['instruction'],prompt_wav,'unit6-teacher')
# Every request below uses the cached speaker features. The two reference-audio
# encoders are no longer needed; release their CPU arenas before synthesis.
model.frontend.campplus_session=None
model.frontend.speech_tokenizer_session=None
gc.collect()
failures=[]
def generate_one(n,item):
    output=Path(item['output'])
    try:
        if output.exists():
            info=sf.info(str(output))
            if info.duration>0.15 and info.frames>0:
                print(f'CACHED {n}/{total}: {item["text"]}',flush=True)
                return
        started=time.perf_counter()
        if item.get('instruction'):
            stream=model.inference_instruct2(item['spokenText'],item['instruction'],prompt_wav,
                zero_shot_spk_id='unit6-teacher',stream=False,speed=.96,text_frontend=False)
        else:
            stream=model.inference_zero_shot(item['spokenText'],prompt,prompt_wav,
                zero_shot_spk_id='bubble-park-original-voice',stream=False,text_frontend=False)
        chunks=[r['tts_speech'].cpu() for r in stream]
        if not chunks: raise RuntimeError('No speech was generated')
        wave=torch.cat(chunks,dim=1).squeeze(0).numpy()
        if len(wave)/model.sample_rate<0.15: raise RuntimeError('Audio is too short')
        output.parent.mkdir(parents=True,exist_ok=True)
        partial=output.with_suffix('.partial.wav')
        sf.write(str(partial),wave,model.sample_rate)
        partial.replace(output)
        print(f'READY {n}/{total}: {item["text"]}; {len(wave)/model.sample_rate:.2f}s; generation={time.perf_counter()-started:.1f}s',flush=True)
        del chunks,wave,stream
    except Exception as e:
        failures.append({'text':item['text'],'error':str(e)})
        print(f'FAILED {n}/{total}: {item["text"]}: {e}',flush=True)
    finally:
        gc.collect()
with ThreadPoolExecutor(max_workers=args.workers) as pool:
    futures=[pool.submit(generate_one,n,item) for n,item in jobs]
    for future in as_completed(futures):
        future.result()
if failures:
    print(json.dumps({'failures':failures},ensure_ascii=False),flush=True)
    raise SystemExit(1)
ready=sum(Path(item['output']).exists() for item in plan)
print(f'{"COMPLETE" if ready==total else "BATCH COMPLETE"}: {ready}/{total} audio clips are ready.',flush=True)
