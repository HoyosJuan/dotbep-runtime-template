import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('hello-lens')
export class HelloLens extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      font-family: inherit;
      color: var(--color-text);
    }
    .count {
      font-size: 2rem;
      font-weight: 600;
    }
    .label {
      font-size: 0.8125rem;
      color: var(--color-text-subtle);
      margin-top: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
  `

  @property({ type: Array }) data: unknown[] = []

  render() {
    return html`
      <div class="count">${this.data.length}</div>
      <div class="label">item${this.data.length !== 1 ? 's' : ''} received</div>
    `
  }
}
