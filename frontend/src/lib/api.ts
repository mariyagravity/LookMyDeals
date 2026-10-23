export async function readApiJson<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      `The API returned a web page instead of JSON (HTTP ${response.status}). Start the backend with "npm run server" and open the app through the Vite server.`
    );
  }
  return response.json() as Promise<T>;
}
