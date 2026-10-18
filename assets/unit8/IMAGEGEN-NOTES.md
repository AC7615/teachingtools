# 单元8图片素材与生成记录

本次使用内置 ImageGen 工具生成游戏背景和透明精灵，未使用API/CLI。闪卡直接展示课本局部，不重绘课本里的数量、记数符号和统计图。

最终网页素材：
- `assets/unit8/fishing-pond.webp`：钓鱼场景。生成原图保留于 `C:/Users/Owner/.codex/generated_images/01a14f8f-6270-7302-a397-b33390ced843/exec-70c6f0bf-c031-4ba8-85b4-652b1eeee971.png`。
- `assets/unit8/game-sprites.webp`：苹果、香蕉、橙、篮子、橙鱼、青鱼的透明精灵图集；WebP使用无损编码，保留alpha。生成原图：`C:/Users/Owner/.codex/generated_images/01a14f8f-6270-7302-a397-b33390ced843/exec-e0286eb1-b8c3-4cf9-94c9-6e74dc34c5ae.png`。
- `assets/unit8/sorting-table.webp`：分类桌面。生成原图：`C:/Users/Owner/.codex/generated_images/01a14f8f-6270-7302-a397-b33390ced843/exec-527ed485-6545-4083-a7fa-a739c978f9d4.png`。
- `assets/unit8/textbook-p76.webp`、`textbook-p77.webp`、`textbook-p78.webp`、`textbook-p79.webp`、`textbook-p80.webp`、`textbook-p81.webp`、`textbook-p83.webp`：从本地教材库复制的原页，用SVG视窗展示所需局部，未改动图中数据。

原页来源：数学课本第二册资料库PDF第82–87、89页，对应印刷页76–81、83页。

## 最终生成提示词

### fishing-pond
Use case: illustration-story. Asset type: wide 1536x1024 background illustration for an interactive first-grade Chinese math fishing game, no UI or text. A warm, polished storybook lakeside in Malaysia, soft hand-painted gouache, cream and jade green with coral accents. Wide peaceful turquoise pond occupies lower 70 percent, water clear and simple with broad open area where animated fish sprites can be placed later. A SMALL wooden fishing pier enters at upper left with a tiny empty stool and fishing rod leaning, distant rounded green hills, lotus leaves confined to corners, small bushes, cheerful daylight. Main central and lower water areas must remain spacious, unobstructed and calm so questions and fish remain legible. Straight-on slightly elevated 2D game scene, gently textured, sophisticated children's picture-book illustration. No fish, no people, no lettering, no numbers, no diagrams, no watermark. This will be an actual web game background, not an image of a device or UI.

### game-sprites
Use case: illustration-story. Asset type: game sprite atlas on a genuinely transparent background, exactly 3 columns x 2 rows in a 1536 by 1024 image, six equally sized 512x512 cells. Warm polished hand-painted gouache children's math game style, bold clean silhouettes, subtle watercolor shading. Each object completely separate and centered in its cell with at least 50px transparent margins, no overlap and no cell borders. TOP LEFT: one large red apple with green leaf. TOP MIDDLE: one yellow banana, a single banana not a bunch. TOP RIGHT: one round orange with small leaf. BOTTOM LEFT: a large empty woven wicker fruit basket FRONT VIEW, oval open dark interior visible at its top, low basket wall, no handle blocking opening, fill most of cell width. BOTTOM MIDDLE: one cheerful orange fish in side view facing right, simple eye and fins. BOTTOM RIGHT: one cheerful teal fish in side view facing right. All six are actual isolated game assets. No shadows beyond object, no props, no text, no numbers, no captions, no background scenery, no watermark. Preserve alpha transparency.

### sorting-table
Use case: illustration-story. Asset type: wide 1536x1024 background for a first-grade math fruit sorting game webpage. Beautiful children's picture-book gouache illustration, warm cream, sage green, soft peach. A lightly textured pale wooden picnic table seen nearly top-down fills 90 percent of frame. Lower third is smooth light wood where three baskets will later be overlaid. Upper two thirds are pale cream fabric lightly textured with barely visible soft gingham, completely empty so small fruit game sprites will stand out clearly. Small garden greenery and a tiny blossom only in far outside corners, at most 5 percent edge. Gentle orchard sunlight and extremely subtle soft shadows. Spacious usable clear play surface. No fruit, no baskets, no people, no hands, no typography, no numbers, no diagrams, no watermark. Actual game background artwork, not device mockup.

## 实现参考
PixiJS v8使用项目已存在的本地绘图引擎；纹理和事件实现参考[官方纹理说明](https://pixijs.com/8.x/guides/components/textures)、[官方事件说明](https://pixijs.com/8.x/guides/components/events)。
