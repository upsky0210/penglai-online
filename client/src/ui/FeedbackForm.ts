export interface FeedbackGameContext {
  playerName: string;
  saveSlot: string;
  sessionId: string;
  mapId: string;
  currentZone: string;
  activeQuest: string;
  chapterProgress: string;
}

export interface FeedbackPayload extends FeedbackGameContext {
  testerName: string;
  schoolName: string;
  classGroup: string;
  feedbackCategory: string;
  deviceType: string;
  difficulty: number;
  stuckPoint: string;
  suggestion: string;
  contactAllowed: boolean;
}

interface FeedbackFormCallbacks {
  setKeyboardEnabled: (enabled: boolean) => void;
  getGameContext: () => FeedbackGameContext;
  submit: (payload: FeedbackPayload) => Promise<void>;
  onNotice: (text: string) => void;
}

export class FeedbackFormController {
  private overlay?: HTMLDivElement;
  private submitReadyAt = 0;

  constructor(private readonly callbacks: FeedbackFormCallbacks) {}

  isOpen() {
    return Boolean(this.overlay);
  }

  toggle() {
    if (this.overlay) {
      this.close();
      return;
    }

    this.open();
  }

  close() {
    if (!this.overlay) {
      return;
    }

    this.overlay.remove();
    this.overlay = undefined;
    this.callbacks.setKeyboardEnabled(true);
  }

  private open() {
    this.close();
    const overlay = document.createElement("div");
    overlay.className = "feedback-overlay";
    overlay.innerHTML = feedbackFormHtml;
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.callbacks.setKeyboardEnabled(false);

    const testerInput = overlay.querySelector<HTMLInputElement>('input[name="testerName"]');
    const schoolInput = overlay.querySelector<HTMLInputElement>('input[name="schoolName"]');
    const classInput = overlay.querySelector<HTMLInputElement>('input[name="classGroup"]');
    try {
      testerInput!.value = window.localStorage.getItem("penglai-feedback-tester") ?? "";
      schoolInput!.value = window.localStorage.getItem("penglai-feedback-school") ?? "";
      classInput!.value = window.localStorage.getItem("penglai-feedback-class") ?? "";
    } catch {
      // Feedback can still be submitted without remembering defaults.
    }
    testerInput?.focus();

    overlay.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape" || (event.key.toLowerCase() === "t" && event.target === overlay)) {
        this.close();
      }
    });
    overlay.querySelector<HTMLButtonElement>("[data-feedback-close]")?.addEventListener("click", () => {
      this.close();
    });
    overlay.querySelector<HTMLFormElement>("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLFormElement) {
        void this.submitForm(event.currentTarget);
      }
    });
  }

  private async submitForm(form: HTMLFormElement) {
    const now = Date.now();
    if (now < this.submitReadyAt) {
      return;
    }

    this.submitReadyAt = now + 1200;
    const formData = new FormData(form);
    const testerName = String(formData.get("testerName") ?? "").trim();
    const schoolName = String(formData.get("schoolName") ?? "").trim();
    const classGroup = String(formData.get("classGroup") ?? "").trim();
    const stuckPoint = String(formData.get("stuckPoint") ?? "").trim();
    const suggestion = String(formData.get("suggestion") ?? "").trim();
    if (!testerName || !classGroup || !stuckPoint || !suggestion) {
      this.callbacks.onNotice("請填完姓名、班級、卡關點與建議。");
      return;
    }

    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    submitButton!.disabled = true;
    submitButton!.textContent = "送出中...";
    try {
      await this.callbacks.submit({
        testerName,
        schoolName,
        classGroup,
        feedbackCategory: String(formData.get("feedbackCategory") ?? "other"),
        deviceType: String(formData.get("deviceType") ?? "unknown"),
        difficulty: Number(formData.get("difficulty") ?? 3),
        stuckPoint,
        suggestion,
        contactAllowed: formData.get("contactAllowed") === "true",
        ...this.callbacks.getGameContext()
      });

      try {
        window.localStorage.setItem("penglai-feedback-tester", testerName);
        window.localStorage.setItem("penglai-feedback-school", schoolName);
        window.localStorage.setItem("penglai-feedback-class", classGroup);
      } catch {
        // Remembering local form defaults is optional.
      }
      this.close();
      this.callbacks.onNotice("回饋已送出，謝謝測試。");
    } catch {
      this.callbacks.onNotice("回饋送出失敗，請確認伺服器連線。");
      submitButton!.disabled = false;
      submitButton!.textContent = "送出回饋";
    }
  }
}

const feedbackFormHtml = `
  <form class="feedback-form">
    <header>
      <div>
        <p>Beta 測試回饋</p>
        <h2>霧港試煉體驗紀錄</h2>
      </div>
      <button type="button" data-feedback-close aria-label="關閉回饋表單">×</button>
    </header>
    <label>
      <span>姓名或代號</span>
      <input name="testerName" type="text" maxlength="40" required />
    </label>
    <label>
      <span>學校</span>
      <input name="schoolName" type="text" maxlength="60" placeholder="可填學校名稱或測試場次" />
    </label>
    <label>
      <span>班級 / 組別</span>
      <input name="classGroup" type="text" maxlength="40" required />
    </label>
    <label>
      <span>回饋分類</span>
      <select name="feedbackCategory">
        <option value="bug">Bug / 錯誤</option>
        <option value="navigation">找不到路 / 任務不清楚</option>
        <option value="balance">太難 / 太簡單</option>
        <option value="ui">介面 / 文字</option>
        <option value="performance">卡頓 / 連線</option>
        <option value="content">希望新增內容</option>
        <option value="other" selected>其他</option>
      </select>
    </label>
    <label>
      <span>測試裝置</span>
      <select name="deviceType">
        <option value="desktop" selected>桌機</option>
        <option value="laptop">筆電</option>
        <option value="tablet">平板</option>
        <option value="mobile">手機</option>
        <option value="unknown">不確定</option>
      </select>
    </label>
    <label>
      <span>難度 1-5</span>
      <select name="difficulty">
        <option value="1">1 很簡單</option>
        <option value="2">2 偏簡單</option>
        <option value="3" selected>3 剛好</option>
        <option value="4">4 偏難</option>
        <option value="5">5 太難</option>
      </select>
    </label>
    <label>
      <span>卡關點</span>
      <textarea name="stuckPoint" maxlength="160" required placeholder="例如：找不到海霧堤道、Boss 太痛、平台跳不上去"></textarea>
    </label>
    <label>
      <span>建議</span>
      <textarea name="suggestion" maxlength="360" required placeholder="例如：希望提示更明顯、怪物少一點、加更多任務"></textarea>
    </label>
    <label class="feedback-inline">
      <input name="contactAllowed" type="checkbox" value="true" />
      <span>老師可以根據這則回饋再詢問我</span>
    </label>
    <footer>
      <span>Esc 或 T 關閉，送出後老師可在管理面板查看。</span>
      <button type="submit">送出回饋</button>
    </footer>
  </form>
`;
