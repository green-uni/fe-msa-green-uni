/**
 * Blob 응답을 받아 Content-Disposition 헤더의 파일명으로 다운로드를 트리거합니다.
 * @param {import('axios').AxiosInstance} axiosInstance
 * @param {string} url
 * @param {string} [fallbackFileName='download']
 */
export async function downloadBlobFile(axiosInstance, url, fallbackFileName = 'download') {
  const res = await axiosInstance.get(url, { responseType: 'blob' });

  const disposition = res.headers['content-disposition'];
  let fileName = fallbackFileName;
  if (disposition) {
    const match = disposition.match(/filename\*=UTF-8''(.+)/i);
    if (match) fileName = decodeURIComponent(match[1]);
  }

  const contentType = res.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([res.data], { type: contentType });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
}
