# 一年级数学成绩后台

Code.gs 与现有 Google Sheet 绑定，Script Properties 中的密码哈希及签名密钥不放入仓库。

## 数据
- Students：现有学生名单与班级。
- Scores：保留单元3、4成绩。
- Scores 同时保存单元5：时间与时刻的挑战与离堂小考核最高成绩；无需建立新的学生表。
- Unit7Scores：单元7最高成绩，原12栏加 ScoreType、QuestionCount、CorrectAnswers、ObstacleHits。

setupUnit7 只建立缺少的单元7工作表，重复执行不会清空成绩。客户端使用单元7：空间；旧单元7：空间硬币闯关别名仍兼容。

## 接口
- classes：返回班级选项。
- searchStudents：className、query，按英文名字或姓名中单词的开头匹配，最多12项，返回有效10分钟的选择签名。
- login：className、selectionToken，返回8小时学生会话；旧 classCode/studentNo 参数仍兼容。
- save：需要有效学生会话；硬币闯关积分不封顶，检核为百分制，按活动及难度保留最高成绩。
- leaderboard：需要有效学生会话，按本班名单筛选，单元7提供各难度最高硬币及检核排行榜。
- teacherLogin/teacherDashboard：沿用原教师密码与会话；增加 spaceEasy/Medium/Hard/Ticket、spaceGameLeaderboard、spaceTicketLeaderboard、unitStats.unit7。

测试：在仓库根目录运行 node tests/backend.test.cjs 与 node tests/teacher.test.cjs。测试使用模拟名单和数据，不写入真实学生成绩。

## 单元5更新（2026-10-12）
原成绩接口已更新为 Apps Script 部署版本12，健康检查 API version=5。
`save` 和 `leaderboard` 返回规范化的 `unit`，客户端先确认单元5支持再上传，避免旧接口回退到单元3。
教师后台增加 timeEasy/Medium/Hard/Ticket、timeGameLeaderboard、timeTicketLeaderboard 和 unitStats.unit5。
挑战按简单20%、中等30%、困难50%加权；检核保留最高分，同分保留较短用时。总排行榜纳入单元5挑战与检核。
练习不上传；公开模式不上传；班级登录后挑战及检核才保存。网络失败的成绩按学生暂存，可以重试。
新增检查：node tests/time.test.cjs、node tests/time-game.test.cjs、node tests/time-records.test.cjs、node tests/overall.test.cjs。
