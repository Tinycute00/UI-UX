import { API_BASE_URL, TOKEN_KEY } from './config.js';
import { toast } from '../js/modals.js';

function getAccessToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

function handleHttpError(response) {
  var status = response.status;
  var errorMessage = '請求失敗';

  if (status === 401) {
    errorMessage = '登入已過期，請重新登入';
    window.location.href = '/login.html';
  } else if (status === 403) {
    errorMessage = '您沒有權限執行此操作';
  } else if (status === 404) {
    errorMessage = '找不到請求的資料';
  } else if (status === 500) {
    errorMessage = '伺服器發生錯誤，請稍後再試';
  } else if (status >= 400 && status < 500) {
    errorMessage = '請求參數錯誤';
  } else if (status >= 500) {
    errorMessage = '伺服器暫時無法回應';
  }

  toast(errorMessage, 'te');
  return Promise.reject(new Error(errorMessage));
}

export function apiGet(path, params) {
  var url = API_BASE_URL + path;
  var queryString = '';
  var headers = {};
  var token = null;

  if (params && typeof params === 'object') {
    queryString = Object.keys(params)
      .filter(function (key) {
        return params[key] !== undefined && params[key] !== null;
      })
      .map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      })
      .join('&');

    if (queryString) {
      url = url + (url.indexOf('?') > -1 ? '&' : '?') + queryString;
    }
  }

  headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  token = getAccessToken();
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  return fetch(url, {
    method: 'GET',
    headers: headers,
  })
    .then(function (response) {
      if (!response.ok) {
        return handleHttpError(response);
      }
      return response.json().then(function (data) {
        return { data: data, error: null };
      });
    })
    .catch(function (error) {
      if (error.message && error.message.indexOf('Failed to fetch') > -1) {
        toast('無法連線至伺服器', 'te');
      }
      return { data: null, error: error };
    });
}

export function apiPost(path, body) {
  var url = API_BASE_URL + path;
  var headers = {};
  var token = null;

  headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  token = getAccessToken();
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  })
    .then(function (response) {
      if (!response.ok) {
        return handleHttpError(response);
      }
      return response.json().then(function (data) {
        return { data: data, error: null };
      });
    })
    .catch(function (error) {
      if (error.message && error.message.indexOf('Failed to fetch') > -1) {
        toast('無法連線至伺服器', 'te');
      }
      return { data: null, error: error };
    });
}
