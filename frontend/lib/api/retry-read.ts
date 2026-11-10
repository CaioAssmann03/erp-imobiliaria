const READ_METHODS = ["GET", "HEAD"];

/**
 * Runs `send`; when the connection to Django drops (`fetch` throws) a read is sent once more.
 * gunicorn recycles a worker every ~1000 requests and closes its idle connections, so one request
 * that reuses such a connection fails although Django is fine. A write is never repeated: it could
 * have been applied before the connection dropped.
 */
export async function retryRead(method: string, send: () => Promise<Response>): Promise<Response> {
  try {
    return await send();
  } catch (error) {
    if (!READ_METHODS.includes(method.toUpperCase())) throw error;
    return send();
  }
}
