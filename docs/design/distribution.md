# OTP Windows 分發方案研究（安裝版 + portable zip）

> 研究日期：2026-11-21（台北時間）
> 研究範圍：GitHub 100K+ stars 專案的 Windows 桌面分發慣例、electron-builder NSIS 設定、OTP 現況
> 原則：所有 star 數皆於 2026-11-21 以 GitHub REST API `stargazers_count` 即時查證；未經查證或無法確認者標示「未確認」。

---

## 1. 研究背景

OTP 目前 `gui/package.json` 的 electron-builder 設定為：

```json
"build": {
  "appId": "com.otp.desktop",
  "productName": "OTP",
  "directories": { "output": "release" },
  "win": { "target": "dir", "signAndEditExecutable": false }
}
```

現況與問題：

- `target: "dir"` 只產生 `gui/release/win-unpacked/`，沒有安裝器。
- 使用者只能拿到「解壓即用」的資料夾，沒有開始功能表／桌面捷徑、沒有反安裝項目。
- README 目前只有從原始碼建置的 Quick Start，沒有下載區塊。
- 尚未程式碼簽章（`signAndEditExecutable: false`、無憑證），Windows SmartScreen 會顯示未知發行者。
- repo 沒有 `build/icon.ico`（現行 portable 版本即為此狀態，暫維持）。

本次目標：

1. 產出 **NSIS 安裝版 `.exe`**（可選安裝目錄、per-user／per-machine、捷徑、反安裝）。
2. **保留 portable no-install `.zip`**（解壓即用、不寫註冊表）。
3. 兩者同一次建置產出，檔名可預測、可貼進 README／Release notes。
4. 未簽章前提下，於 README 誠實說明 SmartScreen 行為。

---

## 2. 查證 star 數表（2026-11-21）

以下數字皆取自 `https://api.github.com/repos/<owner>/<repo>` 的 `stargazers_count` 欄位，查證時間 2026-11-21。

| 專案 | Star 數 | 查證日期 | Windows 分發形態 |
|---|---:|---|---|
| n8n-io/n8n | 211,561 | 2026-11-21 | 無 Windows 桌面版（n8n Desktop 已於 2023 停用、repo 不再維護） |
| microsoft/vscode | 195,691 | 2026-11-21 | 安裝器（User／System 兩種 `.exe`）＋ portable `.zip`＋CLI |
| ollama/ollama | 187,782 | 2026-11-21 | 安裝器 `OllamaSetup.exe`＋各 arch／GPU 變體 `.zip` |
| microsoft/PowerToys | 141,242 | 2026-11-21 | 4 個安裝器 `.exe`（per-user／machine-wide × x64／arm64），無 portable zip |
| electron/electron | 124,027 | 2026-11-21 | 框架本體：各平台 `.zip` 二進位（無 installer） |
| godotengine/godot | 120,499 | 2026-11-21 | 僅 portable `.zip`（`..._win64.exe.zip`），無安裝器 |
| tauri-apps/tauri | 113,031 | 2026-11-21 | 框架：Release 發佈 CLI 二進位；本身不出貨桌面 App |

> 7 個候選都 ≥ 100K，全數保留；但只有 **VS Code、Ollama** 同時具備「安裝器 + portable zip」的完整對照價值，**PowerToys** 是「雙軌安裝器（per-user vs machine-wide）」的最佳範例，**Godot** 是「只有 zip、沒有 installer」的反例。

---

## 3. 各專案分發模式摘要

### 3.1 microsoft/vscode（195,691 stars）

**產物（以 2026-11-21 最新 stable 1.147.0 為例，取自 VS Code 更新 API）：**

- User installer：`VSCodeUserSetup-x64-1.147.0.exe`
- System installer：`VSCodeSetup-x64-1.147.0.exe`
- Portable zip：`VSCode-win32-x64-1.147.0.zip`
- 另有 CLI、arm64 變體；通道為 **Stable / Insiders（每日）**。

**安裝器行為（官方文件明載）：**

- 使用 **Inno Setup** 製作。
- User setup：**免管理員權限**，裝到 `%LOCALAPPDATA%\Programs\Microsoft VS Code`，官方稱為「大多數人建議」的方式。
- System setup：**需要管理員權限**，裝到 `Program Files`，全機使用者可用。
- 安裝時可勾選：加入 `PATH`、桌面圖示、右鍵選單「Open with Code」、檔案關聯等。
- ZIP 版：解壓即用、**需自行手動更新**、沒有捷徑與反安裝。

**下載呈現（code.visualstudio.com/download）：**

- 頁面先偵測本機，給一顆主按鈕：「Download for Windows x64 · User Installer」。
- 下方「All downloads」以 **Windows / macOS / Linux** 分區；Windows 區再分成 **User Installer / System Installer / .zip / CLI** 四列，每列 x64、Arm64 兩個連結。
- 檔名帶版本、帶 arch；User 與 System 用 `VSCodeUserSetup-` / `VSCodeSetup-` 前綴區分，語意清楚。
- README 不放大段下載資訊，主要導向官網下載頁。

### 3.2 microsoft/PowerToys（141,242 stars）

**產物（v0.102.3101.0）：**

- `PowerToysUserSetup-0.102.3101.0-x64.exe`（per-user）
- `PowerToysSetup-0.102.3101.0-x64.exe`（machine-wide）
- 同版本 arm64 各一；另有 `GroupPolicyObjectFiles-*.zip`、`symbols-*.zip`（非 portable 發行版）。

**安裝器行為：**

- per-user 版免管理員；machine-wide 版需管理員（Release notes 直接以「Per user / Machine wide」表格區分）。
- 安裝後有開始功能表項目、設定介面、反安裝程式（PowerToys 為 MSI/WiX 體系的自訂 bootstrapper；底層打包技術細節未逐一確認）。
- 無 portable zip：不想安裝的使用者沒有「解壓即用」選項。

**下載呈現：**

- Release notes 開頭就是 **Installer Hashes** 表格：Description／Filename／SHA256，四列。
- 檔名格式：`<Product><Scope>-<完整四段版本>-<arch>.exe`，全部用連字號、無空格。
- README 只給 Releases 連結，不重複列出四個檔名（避免版本落地）。

### 3.3 ollama/ollama（187,782 stars）

**產物（v0.40.17）：**

- 安裝器：`OllamaSetup.exe`（單一檔案同時支援 x64 與 arm64）
- Portable：`ollama-windows-amd64.zip`、`ollama-windows-arm64.zip`，另有 `-rocm`、`-mlx` 等 GPU 變體
- 另有 `sha256sum.txt`

**安裝器行為（原始 `app/ollama.iss` 可證）：**

- 使用 **Inno Setup**，`PrivilegesRequired=lowest` → **per-user、免管理員**。
- 預設目錄 `{localappdata}\Programs\Ollama`。
- `DisableDirPage=yes`：**不讓使用者選安裝目錄**，走極簡 wizard。
- 捷徑：**只有開始功能表**，沒有桌面捷徑。
- 會把安裝目錄加入**使用者 PATH**，並註冊 `ollama://` URL protocol。
- 反安裝會清 `%LOCALAPPDATA%\Ollama` 等資料，並額外詢問是否刪除模型（`~/.ollama/models`）。
- 檔名**不帶版本**（`OllamaSetup.exe`）：利於固定下載 URL，版本靠 Release tag 表達。

**下載呈現：**

- 官網以作業系統分頁／按鈕引導，Windows 主按鈕即 `OllamaSetup.exe`；進階使用者才會看到 zip 清單。

### 3.4 godotengine/godot（120,499 stars）

- Windows 僅提供 **portable zip**：`Godot_v4.7.2-stable_win64.exe.zip` 等，另有 `_mono_` 變體。
- **沒有安裝器**、沒有捷徑、沒有反安裝；版本與通道（stable／rc／beta）直接寫進檔名。
- 下載頁以「最新穩定版 / 其他版本 / .NET 版」分區，檔案為單一 `.exe` 壓縮在 zip 內。

### 3.5 electron/electron（124,027 stars）

- 框架本身只發佈各平台二進位 zip，例如 `electron-v45.4.1-win32-x64.zip`、`-symbols.zip`。
- **不提供 Windows 安裝器**：安裝器由下游 App 自行用 electron-builder／Forge 產生。
- 命名慣例：`electron-v<semver>-<platform>-<arch>.zip`，全部小寫、連字號。

### 3.6 tauri-apps/tauri（113,031 stars）

- Release 發佈的是 **CLI 工具**（`cargo-tauri-x86_64-pc-windows-msvc.zip` 等），不是桌面 App。
- Tauri 的 bundler 支援 NSIS／MSI，可作為「框架提供安裝器能力、但不自己出貨」的對照。
- 對 OTP 無直接可抄的下載頁範例。

### 3.7 n8n-io/n8n（211,561 stars）— 排除

- n8n Desktop（Windows 桌面版）已於 **2023 年 5 月**停止，官方社群回覆與 `n8n-io/n8n-desktop-app` repo（標示 no longer maintained）皆可證。
- 目前僅有 self-host／npm／Docker，**沒有 Windows 安裝器或 portable zip**，不列入分發慣例參考（只保留在 star 表中說明為何排除）。

---

## 4. 命名慣例比較（installer / zip）

| 專案 | 安裝器檔名 pattern | Portable zip pattern | arch 表達 | 版本位置 | 分隔符 |
|---|---|---|---|---|---|
| VS Code | `VSCodeUserSetup-x64-<ver>.exe`／`VSCodeSetup-x64-<ver>.exe` | `VSCode-win32-x64-<ver>.zip` | 檔名中段 `-x64`／`-arm64` | 檔名 | 連字號，無空格 |
| PowerToys | `PowerToysUserSetup-<ver>-x64.exe`／`PowerToysSetup-<ver>-x64.exe` | 無 | 尾端 `-x64`／`-arm64` | 檔名（四段版號） | 連字號 |
| Ollama | `OllamaSetup.exe`（不帶版號、單檔雙 arch） | `ollama-windows-amd64.zip` | `amd64`／`arm64` | 只在 Release tag | 連字號 |
| Godot | 無 | `Godot_v<ver>-stable_win64.exe.zip` | `win64`／`win32` | 檔名前段 | 底線＋連字號混用 |
| Electron | 無 | `electron-v<ver>-win32-x64.zip` | 尾端 | 檔名 | 連字號 |
| **OTP 採用** | `OTP-Setup-<ver>-x64.exe` | `OTP-<ver>-win-x64.zip` | 尾端 `-x64` | 檔名 | 連字號 |

可歸納的慣例：

1. **產品名 + 用途標記 + 版本 + arch**，例如 `Setup` / `UserSetup` / `win`。
2. **一律用連字號、不用空格**：electron-builder NSIS 預設是 `OTP Setup 0.1.0.exe`（含空格），在 GitHub Release URL 會變成 `%20`，也不符合上面專案的慣例。
3. **安裝器與 zip 用不同字根**（`Setup` vs `win`），避免同名不同副檔名造成使用者混淆。
4. **版本入檔名**（VS Code、PowerToys、Godot）：可長期保存、可 SHA256 對照、Release 頁可精確引用；代價是 `latest/download/<檔名>` 會隨版本失效 → README 改用 `releases/latest` 頁面連結。
5. **版本不入檔名**（Ollama）：`latest/download` 永久連結穩定；代價是檔案不知道版本。OTP 選前者（小專案、版本少、可追溯性優先）。

---

## 5. 安裝器行為比較

| 專案 | 安裝範圍 | 管理員 | 可選安裝目錄 | 桌面捷徑 | 開始功能表 | 反安裝 | 資料處理 |
|---|---|---|---|---|---|---|---|
| VS Code User | per-user（`%LOCALAPPDATA%\Programs`） | 否 | 是（wizard） | 可勾選 | 是 | 有 | 不刪使用者設定 |
| VS Code System | per-machine（`Program Files`） | 是 | 是（wizard） | 可勾選 | 是 | 有 | 同上 |
| PowerToys User | per-user | 否 | 未確認 | 未確認 | 是 | 有 | 設定保留 |
| PowerToys Machine | per-machine | 是 | 未確認 | 未確認 | 是 | 有 | 設定保留 |
| Ollama | per-user（`%LOCALAPPDATA%\Programs\Ollama`） | 否 | 否（`DisableDirPage`） | 否 | 是 | 有 | 反安裝可選擇刪模型 |
| Godot | 不安裝 | — | — | 無 | 無 | 無 | 全在使用者資料夾 |
| **OTP 採用** | 預設 per-user，wizard 可改 per-machine | 選 per-machine 時才提權 | 是 | 是 | 是 | 有 | **不刪 `~/.otp`**（session 資料） |

重點觀察：

- **100K+ 專案沒有「一個安裝器硬幹到底」的**：VS Code、PowerToys 都拆成 User／System 兩個檔案；Ollama 則選擇「只做 per-user」。
- 若只能出一個安裝器，electron-builder 的 assisted installer（`oneClick:false` + `perMachine:false`）會在 wizard 顯示「安裝模式頁」讓使用者二選一（Just me / All users，選 All users 時提權）；drawio-desktop、Upscayl、Joplin 等成熟 Electron 專案即採此模式。
- OTP 的 `~/.otp` 是使用者成果（sessions／worktrees／scratch），**不應在反安裝時刪除**。

---

## 6. 推薦方案：electron-builder 設定（NSIS + zip 同構建）

### 6.1 完整 `build` JSON（取代 `gui/package.json` 的 `build`）

```json
"build": {
  "appId": "com.otp.desktop",
  "productName": "OTP",
  "directories": { "output": "release" },
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "zip", "arch": ["x64"] }
    ],
    "artifactName": "${productName}-${version}-win-${arch}.${ext}",
    "signAndEditExecutable": false
  },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowElevation": true,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "OTP",
    "uninstallDisplayName": "OTP (Octopus Task Planner)",
    "artifactName": "${productName}-Setup-${version}-${arch}.${ext}",
    "runAfterFinish": true,
    "deleteAppDataOnUninstall": false,
    "differentialPackage": false
  }
}
```

> 說明：
> - 不含 `icon`／`installerIcon`：repo 暫無 `build/icon.ico`，現行 portable 版同樣未寫入 exe 資源（`signAndEditExecutable: false`），保持一致；圖示屬後續設計工作（需另行查證 100K+ 專案 icon 慣例）。
> - `uninstallDisplayName` 用全名「OTP (Octopus Task Planner)」，避免「新增或移除程式」清單中與其他 OTP 縮寫項目混淆。

### 6.2 產物預期

| Target | 檔名 | 內容 |
|---|---|---|
| `nsis` | `OTP-Setup-0.1.0-x64.exe` | NSIS 安裝器（wizard、捷徑、反安裝、新增/移除程式項目） |
| `zip` | `OTP-0.1.0-win-x64.zip` | `win-unpacked` 的壓縮檔：`OTP.exe`＋`resources/app.asar`＋DLL，解壓即用 |
| 中間產物 | `release/win-unpacked/` | 仍會存在（electron-builder 一定會先產生 appOutDir），供除錯 |

`zip` 與 `portable` target 的差異（重要）：

- `portable` target 產出**單一自解壓 `.exe`**（每次啟動解壓到暫存），**不是 zip**。
- 需求是「no-install zip」，因此用 `zip` target（打包 `win-unpacked`）。
- 明確指定 `win.artifactName`／`nsis.artifactName`，不依賴預設值；**實際產出檔名以 build 後驗證為準**（zip target 是否套用 `win.artifactName` 未在官方文件逐字明示，未確認）。

另附校驗檔：`gui/scripts/make-checksums.mjs`（`pnpm -F @otp/gui checksums`）對 `release/*.exe`、`release/*.zip` 產生 `release/SHA256SUMS.txt`（比照 PowerToys Release notes hash 表、Ollama `sha256sum.txt`）。

### 6.3 每個關鍵選項的取決理由

| 選項 | 設定 | 預設 | 理由（對照研究） |
|---|---|---|---|
| `win.target` | `nsis` + `zip`（x64） | — | 同時滿足 installer 與 portable；VS Code 也是 installer + zip 雙軌，Upscayl 等成熟 Electron 專案用 `["nsis","zip"]`。 |
| `oneClick` | `false` | `true` | 要讓使用者選安裝目錄與安裝範圍，必須關閉 one-click（drawio、Upscayl、Joplin 皆 `false`）。 |
| `perMachine` | `false` | `false` | 搭配 `oneClick:false` 出現「安裝模式頁」，預設 per-user；VS Code 官方建議 per-user（免管理員），Ollama 也採 per-user。 |
| `allowElevation` | `true` | `true` | 使用者選「所有使用者」時需要提權，才能支援 per-machine。 |
| `allowToChangeInstallationDirectory` | `true` | `false` | 開發工具使用者常想裝到自訂磁碟（drawio、Upscayl、Joplin、Stretchly 皆開啟）。 |
| `createDesktopShortcut` | `true` | `true` | Windows 使用者對桌面圖示有預期；VS Code 列為可勾選、PowerToys 預設建立。 |
| `createStartMenuShortcut` | `true` | `true` | 開始功能表是反安裝／搜尋的主要入口；VS Code、PowerToys、Ollama 全都有。 |
| `shortcutName` | `"OTP"` | `productName` | 與產品名一致（本產品 `productName` 即 OTP，顯式寫出防日後漂移）。 |
| `uninstallDisplayName` | `"OTP (Octopus Task Planner)"` | `${productName} ${version}` | 清單辨識度（比照 PowerToys 顯示名稱加註作法）。 |
| `win.artifactName` | `${productName}-${version}-win-${arch}.${ext}` | 無 | 給 zip 用；帶 `win` 與 arch，對齊 VS Code／Electron 命名。 |
| `nsis.artifactName` | `${productName}-Setup-${version}-${arch}.${ext}` | `${productName} Setup ${version}.${ext}` | 避免預設**空格**；`Setup` 字根與 zip 區隔（PowerToys `PowerToysSetup-...`、VS Code `VSCodeSetup-...`）。 |
| `deleteAppDataOnUninstall` | `false` | `false` | OTP 的 `~/.otp` 是使用者資料，不應刪（此選項僅 one-click 生效，此處為顯式聲明）。 |
| `differentialPackage` | `false` | `true` | 現階段無 electron-updater，不產 `.blockmap` 減少 Release 雜檔；未來加自動更新再開啟。 |
| `runAfterFinish` | `true` | `true` | 安裝完直接啟動，符合桌面 App 慣例。 |
| `signAndEditExecutable` | `false`（維持） | `true` | 目前無憑證，維持現行 portable 版行為；代價是 exe 顯示 Electron 預設圖示（現況如此，不回歸）。 |

### 6.4 建置與驗證

```powershell
cd gui
pnpm build          # vite build && electron-builder
Get-ChildItem release -File   # 應見 OTP-Setup-0.1.0-x64.exe / OTP-0.1.0-win-x64.zip / SHA256SUMS.txt
pnpm checksums      # 產生 SHA256SUMS.txt
```

實務注意：

- 首次跑 NSIS target 時 electron-builder 會下載 NSIS／winCodeSign 到 `%LOCALAPPDATA%\electron-builder\Cache`，需網路。
- 驗證 zip 內容：解壓後應有 `OTP.exe`、`resources\app.asar`、`locales\`；雙擊 `OTP.exe` 應可在不安裝下啟動。
- 驗證安裝器：安裝後檢查開始功能表／桌面捷徑、「設定 → 應用程式」出現 `OTP (Octopus Task Planner)`、反安裝移除程式但保留 `~/.otp`。

### 6.5 未簽名的後果與說法

- 未簽章的 `.exe` 首次執行時，Windows SmartScreen 顯示「Windows 已保護您的電腦」、發行者 **Unknown publisher**；UAC 提權視窗同樣顯示 Unknown publisher。
- 即使簽章，**2024 起 OV／EV 憑證都不再能立即跳過 SmartScreen 信譽累積期**（Microsoft 文件明載）；短期內「文件化步驟」比「買憑證」更實際。
- 做法（對照 PowerToys／Ollama）：
  1. Release 附 **SHA256SUMS.txt**（`pnpm checksums` 產生）。
  2. README 寫明「More info → Run anyway」路徑。
  3. 長期再考慮 OV 憑證或 Azure Trusted Signing。

---

## 7. 推薦 README 下載區塊

位置：`Quick Start` **之前**，標題 `## Download`；TOC 的 `[Download](#quick-start)` 改為 `[Download](#download)`。
內容順序：平台需求 → 安裝版/zip 版兩列 → SHA256 + Releases 連結 → SmartScreen 提示（blockquote）。
連結一律用 `releases/latest` 頁面（檔名含版本，`latest/download/<檔名>` 換版即 404）；Release notes 才放版本鎖定直接連結。

英文版（`README.md`）：

```markdown
## Download

**Windows 10 22H2+ / Windows 11 · x64**

| Build | File | Notes |
|---|---|---|
| **Installer (recommended)** | `OTP-Setup-0.1.0-x64.exe` | Installs for the current user by default (no admin); pick "All users" in the wizard for a machine-wide install. Adds Start Menu / desktop shortcuts and an uninstaller. |
| **Portable** | `OTP-0.1.0-win-x64.zip` | No installation. Extract anywhere and run `OTP.exe`. No shortcuts, no registry entries; update by replacing the folder. |
| Checksums | `SHA256SUMS.txt` | Verify your download before running. |

Grab the latest files from the [Releases page](https://github.com/azusakawa/otp/releases/latest).

> **Unsigned build notice**
> OTP is not code-signed yet. Windows SmartScreen may show **"Windows protected your PC"** with publisher **"Unknown publisher"** — click **More info → Run anyway** to continue.
> To verify first, compare the file's SHA-256 with `SHA256SUMS.txt` in the same release.
```

繁體中文版（`README.zh-TW.md`）：

```markdown
## 下載

**Windows 10 22H2+ / Windows 11 · x64**

| 版本 | 檔案 | 說明 |
|---|---|---|
| **安裝版（建議）** | `OTP-Setup-0.1.0-x64.exe` | 預設安裝給目前使用者（免管理員）；wizard 中可改選「所有使用者」。會建立開始功能表／桌面捷徑，並提供反安裝。 |
| **免安裝版** | `OTP-0.1.0-win-x64.zip` | 解壓即用，執行 `OTP.exe` 即可。不寫註冊表、不建捷徑；更新時直接取代整個資料夾。 |
| 校驗檔 | `SHA256SUMS.txt` | 執行前可先比對 SHA-256。 |

請至 [Releases 頁面](https://github.com/azusakawa/otp/releases/latest) 取得最新版本。

> **未簽章提醒**
> OTP 目前尚未程式碼簽章，Windows SmartScreen 可能顯示 **「Windows 已保護您的電腦」**、發行者 **「未知的發行者」** — 點選 **「更多資訊」→「仍要執行」** 即可繼續。
> 若想先驗證，請比對同一個 Release 中 `SHA256SUMS.txt` 的 SHA-256。
```

---

## 8. 參考來源

**Star 數（2026-11-21 查證）**

- https://api.github.com/repos/microsoft/vscode
- https://api.github.com/repos/n8n-io/n8n
- https://api.github.com/repos/ollama/ollama
- https://api.github.com/repos/microsoft/PowerToys
- https://api.github.com/repos/electron/electron
- https://api.github.com/repos/godotengine/godot
- https://api.github.com/repos/tauri-apps/tauri

**Release／下載產物**

- https://github.com/microsoft/vscode/releases
- https://code.visualstudio.com/download
- https://code.visualstudio.com/docs/setup/windows
- https://update.code.visualstudio.com/api/update/win32-x64-user/stable/latest
- https://github.com/microsoft/PowerToys/releases/tag/v0.102.3101
- https://github.com/ollama/ollama/releases/tag/v0.40.17
- https://raw.githubusercontent.com/ollama/ollama/main/app/ollama.iss
- https://github.com/godotengine/godot/releases/tag/4.7.2-stable
- https://github.com/electron/electron/releases/tag/v45.4.1
- https://github.com/tauri-apps/tauri/releases
- https://github.com/n8n-io/n8n-desktop-app
- https://community.n8n.io/t/airtable-authorization-failed-using-n8n-desktop-application/43115

**electron-builder 官方文件／原始碼**

- https://www.electron.build/nsis
- https://www.electron.build/docs/targets
- https://www.electron.build/docs/configuration
- https://www.electron.build/docs/features/code-signing/code-signing-win
- https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/targets/win/nsis/nsisOptions.ts
- https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/options/winOptions.ts

**真實 Electron 專案 build 設定（命名／選項對照）**

- https://github.com/jgraph/drawio-desktop/blob/dev/electron-builder-win.json
- https://github.com/upscayl/upscayl/blob/main/package.json
- https://github.com/laurent22/joplin/blob/dev/packages/app-desktop/package.json
- https://github.com/qishibo/AnotherRedisDesktopManager/blob/master/pack/electron/package.json
- https://github.com/hovancik/stretchly/blob/trunk/package.json

**SmartScreen／簽章信譽**

- https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/distribution-feature-status#smartscreen-reputation-ev-certificates-no-longer-grant-instant-bypass
- https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options

**OTP 現況（本地唯讀檢視）**

- `gui/package.json`（`build.win.target = "dir"`、`signAndEditExecutable: false`）
- `gui/release/`（僅 `win-unpacked/`、`builder-debug.yml`）
- `README.md`（無下載區塊，Quick Start 為原始碼建置）

