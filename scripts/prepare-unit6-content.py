from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding="utf-8")
p=Path('units/unit6-content.js');old=p.read_text(encoding='utf-8');tail=old[old.index(' function ticket('):]
qs=[]
def add(kind,level,text,options,answer,why,scene):
 qs.append(dict(id='m'+str(len(qs)+1),kind=kind,level=level,text=text,options=[{'text':x} for x in options],answer=answer,explanation=why,scene=scene,standard='6.1.1' if kind=='words' else '6.2.1',source='一年级数学 · 度量衡'))
words=[(0,'上面的铅笔怎样？',['长','短','高'],0,'上面的铅笔比下面的长。'),(0,'下面的铅笔怎样？',['长','短','厚'],1,'下面的铅笔比上面的短。'),(1,'左边的长颈鹿怎样？',['高','矮','厚'],0,'站在同一地面上，左边的长颈鹿较高。'),(1,'右边的长颈鹿怎样？',['高','矮','薄'],1,'站在同一地面上，右边的长颈鹿较矮。'),(2,'左边的书怎样？',['薄','厚','远'],1,'左边书页叠起来的厚度较大。'),(2,'右边的书怎样？',['厚','薄','近'],1,'右边的书比左边的薄。'),(3,'学校旁边的小兔离学校怎样？',['近','远','重'],0,'学校旁边的小兔离学校较近。'),(3,'下方的小兔离学校怎样？',['近','远','轻'],1,'下方的小兔与学校之间的距离较远。'),(4,'石头比羽毛怎样？',['轻','重','空'],1,'石头一边的托盘较低，石头比较重。'),(4,'羽毛比石头怎样？',['轻','重','满'],0,'羽毛一边的托盘较高，羽毛比较轻。'),(5,'左边的杯子是什么状态？',['满','半满','空'],0,'左边的杯子装满了果汁。'),(5,'中间的杯子是什么状态？',['满','半满','空'],1,'中间的杯子装了一半的果汁，叫半满。'),(5,'右边的杯子是什么状态？',['满','半满','空'],2,'右边的杯子没有果汁，叫空。')]
for cell,text,opts,ans,why in words:add('words','简单',text,opts,ans,why,{'type':'flash','cell':cell})
add('method','简单','量铅笔的长度，哪一种非标准单位最合适？',['回形针','一杯水','脚步'],0,'回形针较小，适合首尾相接地量铅笔。',{'type':'tools','object':'pencil','tools':['clip','cup','foot']})
add('method','简单','用天平量玩偶的质量，哪一种单位最合适？',['相同积木','脚步','虎口'],0,'可以用相同积木作质量单位，放在另一边托盘。',{'type':'tools','object':'bear','tools':['block','foot','hand']})
add('method','简单','量一壶水的液体体积，哪一种单位最合适？',['小杯','回形针','虎口'],0,'用同样的小杯，每次装满，再数有几杯。',{'type':'tools','object':'jug','tools':['cup','clip','hand']})
add('length','中等','回形针首尾相接。看图，铅笔大约有多长？',['6枚回形针长','6块积木长','5枚回形针长'],0,'六枚相同回形针从铅笔左端量到右端。',{'type':'length','rows':[{'object':'pencil','unit':'clip','count':6}]})
add('length','中等','橡皮首尾相接。看图，书大约有多长？',['4块橡皮长','4枚回形针长','5块橡皮长'],0,'书的长度等于四块相同橡皮的长度。',{'type':'length','rows':[{'object':'book','unit':'eraser','count':4}]})
add('length','中等','纽扣紧挨着排好。看图，丝带大约有多长？',['7颗纽扣长','8颗纽扣长','8杯水'],1,'八颗相同纽扣从丝带的一端排到另一端。',{'type':'length','rows':[{'object':'ribbon','unit':'button','count':8}]})
add('mass','中等','天平平衡。看图，玩偶大约有多重？',['4块积木重','3块积木重','4杯水'],0,'玩偶与四块相同积木平衡，所以大约有四块积木重。',{'type':'mass','rows':[{'object':'bear','unit':'block','count':4}]})
add('mass','中等','天平平衡。看图，苹果大约有多重？',['5枚硬币重','6枚硬币重','6枚回形针长'],1,'苹果与六枚相同硬币平衡。',{'type':'mass','rows':[{'object':'apple','unit':'coin','count':6}]})
add('mass','中等','天平平衡。看图，玩具车大约有多重？',['4颗石子重','4颗纽扣长','2颗石子重'],0,'玩具车与四颗相同石子平衡。',{'type':'mass','rows':[{'object':'car','unit':'stone','count':4}]})
add('volume','中等','这壶水刚好倒满图中的小杯。水大约有多少？',['4小杯水','4大杯水','3小杯水'],0,'四个相同小杯都装满，所以有四小杯水。',{'type':'capacity','rows':[{'label':'这壶水','count':4,'cup':'small','source':True}]})
add('volume','中等','这壶果汁刚好倒满图中的大杯。果汁大约有多少？',['2大杯果汁','3大杯果汁','3小杯果汁'],1,'三个相同大杯都装满，所以有三大杯果汁。',{'type':'capacity','juice':True,'rows':[{'label':'这壶果汁','count':3,'cup':'large','source':True}]})
add('volume','中等','这壶水刚好倒满图中的小碗。水大约有多少？',['2碗水','3碗水','2枚回形针长'],0,'两个相同小碗都装满，所以有两碗水。',{'type':'capacity','rows':[{'label':'这壶水','count':2,'cup':'bowl','source':True}]})
add('method','中等','看图，哪一排回形针正确量出铅笔的长度？',['甲排','乙排','两排都正确'],1,'乙排从左端开始，首尾相接，既没有空隙，也没有重叠。',{'type':'length','rows':[{'label':'甲排','object':'pencil','unit':'clip','count':4,'gap':18},{'label':'乙排','object':'pencil','unit':'clip','count':4}]})
add('length','困难','同一支铅笔用回形针和橡皮量。为什么橡皮的个数较少？',['每块橡皮较长','铅笔变短了','两种单位一样长'],0,'同一长度，每个单位较长时，所需的个数较少。',{'type':'length','sameTotal':True,'rows':[{'label':'同一支铅笔','object':'pencil','unit':'clip','count':6},{'label':'同一支铅笔','object':'pencil','unit':'eraser','count':4}]})
add('mass','困难','同一个玩偶用积木和豆子量。为什么积木的个数较少？',['每块积木比较重','玩偶变轻了','豆子和积木一样重'],0,'同一质量，每个单位较重时，所需的个数较少。',{'type':'mass','rows':[{'object':'bear','unit':'block','count':4,'label':'同一个玩偶'},{'object':'bear','unit':'bean','count':12,'label':'同一个玩偶'}]})
add('volume','困难','同一壶水用小杯和大杯量。为什么大杯的杯数较少？',['每大杯装的水较多','水自己变少了','大杯和小杯一样大'],0,'同一液体体积，每个容器较大时，所需的杯数较少。',{'type':'capacity','rows':[{'label':'同一壶水','count':6,'cup':'small'},{'label':'同一壶水','count':3,'cup':'large'}]})
add('compare','困难','都用相同回形针量。把物品从短到长排列，哪一项正确？',['丝带、铅笔、书','铅笔、丝带、书','书、铅笔、丝带'],0,'用相同单位，四枚最短，六枚其次，八枚最长。',{'type':'length','rows':[{'label':'铅笔','object':'pencil','unit':'clip','count':6},{'label':'丝带','object':'ribbon','unit':'clip','count':4},{'label':'书','object':'book','unit':'clip','count':8}]})
add('compare','困难','都用相同积木量。把物品从轻到重排列，哪一项正确？',['苹果、玩偶、玩具车','玩具车、玩偶、苹果','玩偶、苹果、玩具车'],0,'苹果三块、玩偶五块、玩具车七块，所以按三、五、七排列。',{'type':'mass','rows':[{'object':'apple','unit':'block','count':3},{'object':'bear','unit':'block','count':5},{'object':'car','unit':'block','count':7}]})
add('compare','困难','用相同小杯量三份水。从少到多排列，哪一项正确？',['甲、丙、乙','甲、乙、丙','乙、丙、甲'],0,'甲三杯、丙四杯、乙五杯，所以甲最少，乙最多。',{'type':'capacity','rows':[{'label':'甲','count':3,'cup':'small'},{'label':'乙','count':5,'cup':'small'},{'label':'丙','count':4,'cup':'small'}]})
add('length','困难','甲用6块大橡皮量，乙用6枚小回形针量。哪张桌子较长？为什么？',['甲桌，每个单位较长','乙桌，每个单位较短','一样长，都是6个'],0,'数量相同，甲使用的每个单位较长，所以甲桌较长。',{'type':'length','rows':[{'label':'甲桌','object':'table','unit':'eraser','count':6},{'label':'乙桌','object':'table','unit':'clip','count':6}]})
add('mass','困难','一块积木和3粒豆子一样重。看图，玩偶和球谁较重？为什么？',['玩偶，使用的单位较重','一样重，都是4个','球，因为豆子较小'],0,'玩偶等于四块积木，球等于四粒豆子。每块积木比每粒豆子重，所以玩偶较重。',{'type':'mass','equivalence':True,'rows':[{'object':'bear','unit':'block','count':4},{'object':'ball','unit':'bean','count':4}]})
add('compare','困难','甲有4小杯水，乙有4大杯水。谁的水较多？为什么？',['乙，每大杯装水较多','一样多，都是4杯','甲，小杯装得更多'],0,'杯数相同，大杯的容量较大，所以乙的水较多。',{'type':'capacity','rows':[{'label':'甲','count':4,'cup':'small'},{'label':'乙','count':4,'cup':'large'}]})
add('volume','困难','一大杯等于2小杯。甲有3小杯，乙有2大杯。谁较多？为什么？',['乙，2大杯等于4小杯','甲，因为3比2大','一样多'],0,'把乙换成相同小杯，是二加二等于四小杯；四比三多。',{'type':'capacity','equivalence':True,'rows':[{'label':'甲','count':3,'cup':'small'},{'label':'乙','count':2,'cup':'large'}]})
p.write_text('/* Picture-based Unit 6 bank: easy vocabulary/tools, medium measurement, hard unit reasoning. */\nconst MeasureContent=(()=>{\n const questions='+json.dumps(qs,ensure_ascii=False,separators=(',',':'))+';\n'+tail,encoding='utf-8')
Path('units/unit6-question-bank.json').write_text(json.dumps(qs,ensure_ascii=False,indent=2),encoding='utf-8')
entries=[]
for key,level,title,theme,description in [('easy','简单','容易 · 软糖乐园','gummy','比较词汇 · 选择合适的非标准单位'),('medium','中等','中等 · 拼插积木城','bricks','正确测量 · 数量加单位'),('hard','困难','困难 · 水晶高塔','crystal','单位大小 · 排列顺序 · 解释判断')]:
 pack=dict(schemaVersion=1,id='measure-'+key,version='2',title=title,theme=theme,description=description,questions=[q for q in qs if q['level']==level]);Path('units/unit6-tower/content/'+key+'.json').write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':')),encoding='utf-8');entries.append(dict(id=pack['id'],title=title,theme=theme,description=description,path='content/'+key+'.json'))
Path('units/unit6-tower/content/catalog.json').write_text(json.dumps({'packs':entries},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Prepared',len(qs),'illustrated questions:',[(l,len([q for q in qs if q['level']==l])) for l in ['简单','中等','困难']])
