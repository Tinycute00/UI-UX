import { API_MODE } from '../config.js';
import { apiGet } from '../client.js';

export function getValuations(page, pageSize, status) {
  var p = page || 1;
  var ps = pageSize || 10;
  var params = { page: p, pageSize: ps };

  if (status) {
    params.status = status;
  }

  return apiGet('/valuations', params).then(function (result) {
    if (result.error) {
      return Promise.reject(result.error);
    }
    return result.data;
  });
}