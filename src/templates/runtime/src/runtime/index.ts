import * as BEP from '@dotbep/core'
import type { BepTypes } from '../bep.js'
import { helloEffect }     from './effects/hello-effect.js'
import { helloAutomation } from './automations/hello-automation.js'
import { helloResolver }   from './resolvers/hello-resolver.js'
import { helloTrigger }    from './triggers/hello-trigger.js'

export default class BepRuntime extends BEP.Runtime<BepTypes> {
  constructor(options: BEP.RuntimeOptions) {
    super(options)
    this.effect('hello-effect',         helloEffect)
    this.automation('hello-automation', helloAutomation)
    this.resolver('hello-resolver',     helloResolver)
    this.trigger('your-workflow-id',    helloTrigger)
  }
}
