import type { WorkflowInstance } from '@dotbep/core'

export async function helloTrigger(_rawPayload: unknown): Promise<WorkflowInstance['trackedAsset']> {
  return {
    assetTypeId: 'ITEM',
    source:      'external:hello',
    id:          'hello-1',
    label:       'Hello from trigger',
  }
}
