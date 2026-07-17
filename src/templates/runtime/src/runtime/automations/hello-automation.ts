import type { WorkflowInstance } from '@dotbep/core'

export async function helloAutomation(instance: WorkflowInstance): Promise<{ eventId: string }> {
  console.log(`[hello-automation] evaluating asset: ${instance.trackedAsset.id}`)
  return { eventId: 'approved' }
}
