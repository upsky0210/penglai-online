# Day 20 開發紀錄
日期：2026-06-25  
專案：蓬萊異聞錄 Online  
主題：設定面板與音量控制

## 今日目標

Day 17 加入音效後，玩家需要能控制音量。  
Day 20 的目標是新增第一版設定面板，讓玩家可以開關音效與調整音量。

## 完成內容

### 1. 新設定面板

新增設定面板：

```text
V 開關設定面板
M 靜音 / 取消靜音
N 降低音量
B 提高音量
```

`N/B` 只有在設定面板開啟時用來調音量，避免平常影響商店操作。

### 2. 音量狀態

client 新增本機狀態：

```text
audioVolume
audioMuted
settingsPanelVisible
```

音效播放時會套用音量倍率。  
靜音時不建立或播放 tone。

### 3. localStorage 記憶設定

音效設定存到：

```text
penglai-audio-settings
```

這是本機偏好設定，不寫入 SQLite 角色存檔。  
同一台瀏覽器下次開遊戲會沿用音量與靜音狀態。

### 4. 設定面板內容

面板會顯示：

```text
音效：開啟 / 關閉
音量：0% - 100%
```

調整音量時會顯示對話提示，並播放一個短測試音。

## 修改檔案

```text
client/src/scenes/GameScene.ts
docs/DAY20.md
```

## 測試結果

已執行：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

結果：

```text
shared typecheck 通過
server typecheck 通過
client typecheck 通過
client build 通過
```

## Padlet AI 日誌簡要版

今天完成 Day 20：設定面板與音量控制。因為 Day 17 已經加入技能音效，所以今天補上玩家端控制。現在按 V 可以開設定面板，按 M 可以靜音，面板開啟時用 N/B 調整音量。音量設定會存在瀏覽器 localStorage，不會寫進角色 SQLite 存檔。這讓遊戲開始有比較完整的使用者設定，不只是單純能玩。

## 下一階段建議

Day 21 可以做小地圖導覽與區域名稱提示：

```text
進入安全區顯示區域名稱
右側新增路標
任務目標可以提示大概方向
```

也可以開始做角色死亡懲罰、更多裝備或技能升級。
