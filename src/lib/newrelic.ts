import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'
import { env } from './env'

let nrAgent: BrowserAgent | null = null

export function initializeNewRelic() {
  // Only initialize if New Relic is configured and not in development (optional)
  if (!env.isNewRelicConfigured) {
    console.info('New Relic monitoring is not configured. Skipping initialization.')
    return null
  }

  // Avoid double initialization
  if (nrAgent) {
    console.warn('New Relic agent already initialized')
    return nrAgent
  }

  try {
    const options = {
      init: {
        distributed_tracing: { enabled: true },
        privacy: { cookies_enabled: true },
        ajax: { deny_list: [] },
        session_replay: { enabled: true },
        session_trace: { enabled: true }
      },
      info: {
        beacon: 'bam.nr-data.net',
        errorBeacon: 'bam.nr-data.net',
        licenseKey: env.newRelicLicenseKey,
        applicationID: env.newRelicApplicationId,
        sa: 1
      },
      loader_config: {
        accountID: env.newRelicAccountId,
        trustKey: env.newRelicTrustKey,
        agentID: env.newRelicAgentId,
        licenseKey: env.newRelicLicenseKey,
        applicationID: env.newRelicApplicationId
      }
    }

    // The agent loader code executes immediately on instantiation
    nrAgent = new BrowserAgent(options)
    
    console.info('New Relic browser agent initialized successfully')
    return nrAgent
  } catch (error) {
    console.error('Failed to initialize New Relic browser agent:', error)
    return null
  }
}

export function getNewRelicAgent() {
  return nrAgent
}

// Type for custom attributes
type CustomAttributeValue = string | number | boolean
type CustomAttributes = Record<string, CustomAttributeValue>

// Declare New Relic global
declare global {
  interface Window {
    newrelic?: {
      addPageAction: (name: string, attributes?: CustomAttributes) => void
      noticeError: (error: Error, attributes?: CustomAttributes) => void
      setCustomAttribute: (name: string, value: CustomAttributeValue) => void
    }
  }
}

// Export helper functions for custom instrumentation
export function recordCustomEvent(eventName: string, attributes?: CustomAttributes) {
  if (nrAgent && globalThis.window?.newrelic) {
    globalThis.window.newrelic.addPageAction(eventName, attributes)
  }
}

export function recordError(error: Error, attributes?: CustomAttributes) {
  if (nrAgent && globalThis.window?.newrelic) {
    globalThis.window.newrelic.noticeError(error, attributes)
  }
}

export function setCustomAttribute(name: string, value: CustomAttributeValue) {
  if (nrAgent && globalThis.window?.newrelic) {
    globalThis.window.newrelic.setCustomAttribute(name, value)
  }
}
