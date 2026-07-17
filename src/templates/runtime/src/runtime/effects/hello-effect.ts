import type { WorkflowInstance } from '@dotbep/core'

export async function helloEffect(instance: WorkflowInstance): Promise<void> {
  console.log(`[hello-effect] triggered for asset: ${instance.trackedAsset.id}`)
}
