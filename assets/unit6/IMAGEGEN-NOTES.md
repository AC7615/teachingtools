# ImageGen 图片素材

使用内置 ImageGen，2026-10-16。最终项目文件：

项目根目录：`C:/Users/Owner/OneDrive/文档/GitHub/teachingtools`。以下路径均相对于这个目录。

- assets/unit6/lab-sprites-v2.png：20 个测量物品和工具的透明原画 atlas。对应 frames.json 记录完整物体边界，原位图不重绘。
- assets/unit6/map-gummy.png：容易 / 软糖乐园。
- assets/unit6/map-bricks.png：中等 / 拼插积木城。
- assets/unit6/map-crystal.png：困难 / 水晶高塔。

三张地图均使用下列共同提示词，Subject 分别替换为下面的内容：

Use case: illustration-story. Asset type: landscape world-map illustration for a Chinese first-grade mathematics stacking game. [Subject]. A single cohesive island scene in polished whimsical children's book 3D illustration style, soft light, clear friendly shapes, wide composition, main tower in center, enough calm negative space around it, no characters, no words, no letters, no logos, no watermark. Distinct material must be very clear. Landscape artwork.

Subject / gummy:
A magical pastel gummy candy island, soft translucent jelly cube tower, rounded gummy building blocks, mint and strawberry pink sky, marshmallow clouds, playful gentle candy hills

Subject / bricks:
A bright interlocking toy construction block island, colorful red yellow blue studded plastic brick tower, visible round studs on top, playful toy workshop hills, blue sunny sky

Subject / crystal:
A beautiful teal violet crystal island, faceted translucent turquoise crystal cube tower, glowing gemstones, gentle starry lavender sky, magical geometric crystal hills

题目中的数量、排列、天平关系与水量使用可编辑 SVG 精确排版，物品插画复用 atlas。游戏方块的材质通过 canvas 绘制，保持原版支撑判定和形状几何。

测量物品 atlas 原始提示词（透明背景）：

ONE sprite atlas for a first-grade math virtual measurement laboratory, exactly FOUR columns by FIVE rows, 20 equally sized square cells, overall aspect ratio 4:5. TRUE transparent background throughout all cells. Every object centered fully inside its own cell with at least 18% transparent padding around it, no overlaps across cells, no writing no labels no grid lines no numbers. All objects in same beautifully polished playful hand-painted 3D toy illustration style, bright coral mint golden yellow lavender colors, soft dimensional shading, exceptionally clear silhouettes for young children. Objects are realistic recognizable everyday items, not emoji, not flat icons. Orthographic clean view, never crop tips. Row1 from left to right: long horizontal orange pencil facing right; closed teal storybook horizontal; horizontal pink ribbon laid straight and flat; cute small teddy bear front view. Row2: horizontal shiny silver paper clip with visible inner loop; pink and blue rectangular rubber eraser horizontal; one pale natural wooden cube; one gold coin front view with a simple star but NO text. Row3: one blue glass marble; one red kidney bean; one yellow round four-hole button; one smooth small gray stone. Row4: SMALL transparent clear glass cup EMPTY front view; MEDIUM transparent clear glass cup EMPTY front view; LARGE transparent clear glass cup EMPTY front view; shallow clear glass bowl EMPTY front view. Cup rims and walls clearly visible on transparency; the small medium large cup shapes must be clean straight-sided cylinders differing in width/height, and all are EMPTY with no water. Row5: large clear glass water jug EMPTY with handle on right, front view; orange juice bottle with no label, front view; fresh red apple with green leaf; friendly red toy car side view. For row4 and jug row5 use simple straight lower walls so blue liquid can be animated behind the sprite. No hands, rulers, platforms, scenery, or floating decorations. Sprite asset sheet only, consistent lighting and style, genuine alpha transparent background.
