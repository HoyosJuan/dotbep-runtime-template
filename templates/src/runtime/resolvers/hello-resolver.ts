export async function helloResolver(_url: string): Promise<{ message: string; timestamp: string }> {
  return {
    message:   'Hello from the resolver!',
    timestamp: new Date().toISOString(),
  }
}
