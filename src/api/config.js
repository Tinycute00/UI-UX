/* ═══ API 全局配置 ═══ */

/**
 * API 運作模式
 * - 'mock': 使用本地靜態資料 (預設)
 * - 'api': 使用真實 API endpoints
 */
export var API_MODE = 'api';

/**
 * API 基礎路徑
 */
export var API_BASE_URL = '/api/v1';

/**
 * 預設專案 API ID（正整數，用於打 backend API）
 * backend 接受 /projects/:id 路由中的正整數，不接受字串型 display ID
 */
export var DEFAULT_PROJECT_ID = 101;

/**
 * 預設專案顯示 ID（字串，僅用於 UI 展示，不可用於 API 請求）
 */
export var DEFAULT_PROJECT_DISPLAY_ID = 'PROJ-2025-001';

/**
 * SessionStorage token key
 */
export var TOKEN_KEY = 'pmis_access_token';
