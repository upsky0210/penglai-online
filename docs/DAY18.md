# Day 18 開發紀錄
日期：2026-06-25  
專案：蓬萊異聞錄 Online  
主題：第一張正式小地圖與第二種怪物

## 今日目標

Day 17 已完成技能音效與打空回饋。  
Day 18 開始把測試場景往正式小地圖推進：擴大霧港郊外，加入第二個區域與第二種怪物。

## 完成內容

### 1. 地圖擴大

地圖寬度從 1800 擴大到 2400。  
右側新增「燈塔營地」與潮汐林道視覺區域，讓玩家可以往右探索更遠的地方。

### 2. 新安全區

新增安全區：

```text
燈塔營地
位置：約 x=1510
用途：新 NPC 站位與任務交付點
```

### 3. 新平台

新增右側平台：

```text
tide-step-1
tide-step-2
lighthouse-step
```

讓右側不只是平地，也有一點橫向跳台空間。

### 4. 第二種怪物

新增怪物種類：

```text
mist-slime -> 海霧史萊姆
```

目前配置 3 隻：

```text
slime-1：地面巡邏
slime-2：地面巡邏
slime-3：高台巡邏
```

海霧史萊姆 HP 比田鼠高，經驗也較高。

### 5. 怪物外觀差異

client 端怪物顯示改成依怪物種類上色：

```text
田鼠：紅褐色
海霧史萊姆：藍綠色
```

受擊變白後會恢復各自原本顏色。

## 修改檔案

```text
shared/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY18.md
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

WebSocket 驗證：

```text
world:snapshot 內有 3 隻田鼠
world:snapshot 內有 3 隻海霧史萊姆
mist-gel-lantern 新任務有送到 client
```

## Padlet AI 日誌簡要版

今天完成 Day 18：把原本的測試場景往正式小地圖推進。地圖寬度從 1800 擴大到 2400，右側新增燈塔營地與潮汐林道，並加入第二種怪物「海霧史萊姆」。史萊姆比田鼠更耐打，經驗較高，外觀也改成藍綠色，讓玩家一眼能分辨不同怪物。這是從單一測試場景走向可探索區域的第一步。
