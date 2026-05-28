export function helloAdapter(data: unknown): { label: string; value: string }[] {
  const d = data as { message: string; timestamp: string }
  return [
    { label: 'Message',   value: d.message },
    { label: 'Timestamp', value: d.timestamp },
  ]
}
