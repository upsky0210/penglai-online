# P6 課堂負載基線

量測日期：2026-07-12  
執行環境：Windows、Node.js v24.15.0  
指令：`npm run smoke:classroom-load`

## 方法

- 每個情境啟動獨立 server、隨機 port 與暫存 SQLite，完成後自動清理。
- 分別建立 10 與 30 個 WebSocket client，全部位於 `fog-harbor-test`。
- 每個 client 以 10Hz 發送合法的移動更新，持續取樣 5 秒。
- 量測 world tick、快照序列化／流量、client 收件率及 dirty-save flush。
- 每個情境都會觸發一次身份鎖定存檔，因此 10／30 人情境分別實際寫入 10／30 筆存檔。

## 驗收門檻

| 指標 | 門檻 |
|---|---:|
| 有效 world tick | ≥ 10Hz |
| 平均 tick 執行時間 | ≤ 15ms |
| 平均 tick 排程延遲 | ≤ 20ms |
| 最大 tick 排程延遲 | ≤ 250ms |
| 同圖序列化次數 | ≤ active maps + 1 / pass |
| 每位 client 快照率 | ≥ 9/s |
| 每位 client server 下行 | ≤ 250KB/s |
| 平均 save flush | ≤ 25ms |
| 最大 save flush | ≤ 150ms |
| save failure／殘留佇列 | 0 |

## 2026-07-12 基線結果

| 指標 | 10 人 | 30 人 |
|---|---:|---:|
| world tick | 12.8Hz | 13.0Hz |
| tick 平均／最大 | 1.19 / 2.08ms | 3.29 / 6.49ms |
| 排程延遲平均／最大 | 10.77 / 39.45ms | 10.97 / 88.13ms |
| 序列化／pass | 1.00 | 1.00 |
| 訊息／pass | 10 | 30 |
| server bytes／client／秒 | 53,348 | 130,960 |
| client 實收 bytes／秒 | 54,853 | 134,529 |
| 快照／client／秒 | 12.8 | 13.0 |
| save 平均／最大 | 1.53 / 1.79ms | 1.48 / 2.16ms |
| save attempts／failures／queued | 10 / 0 / 0 | 30 / 0 / 0 |

## 判讀

- 30 人情境通過目前課堂目標。tick 執行時間平均只佔 66.7ms 理論預算約 4.9%，CPU 還有明顯餘裕。
- per-map 共用序列化有效：10 人與 30 人同圖都維持每 pass 一次 `JSON.stringify`。
- 30 人 dirty-save burst 全數成功，平均單筆約 1.5ms，測試結束沒有殘留佇列。
- 目前最接近限制的是頻寬，而不是 tick 或 SQLite。30 人同圖約 131KB/s／client，server 世界快照下行合計約 31.4Mbps（未計 WebSocket/TCP 額外開銷）。
- Windows timer 下實際快照率約 13Hz，低於設定的 15Hz，但在 10→30 人時沒有下降，顯示不是人數增加造成飽和。

完整 `check:release` 的第二次隔離重跑得到相近結果：10 人 tick 平均 0.94ms、下行 53,332 bytes/client/s；30 人 tick 平均 2.63ms、下行 130,899 bytes/client/s；兩組 save failure／queued 仍為 0。結果可重現，沒有只在單次量測碰巧通過。

## 後續決策

- 現階段不需要為 30 人班級改成 delta snapshot。
- 若目標提升到 50 人、跨網路使用或同時承載多班，先重新執行本探針；若下行超標，再考慮降低快照頻率或導入差量快照。
- 美術資產增加後應重跑，確認更大的地圖／實體數量沒有改變快照大小與 client 渲染負載。
