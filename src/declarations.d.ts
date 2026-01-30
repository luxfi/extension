declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.svg?url' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

// Firefox WebExtension API global
declare const browser: typeof chrome & {
  browserAction?: {
    onClicked: {
      addListener: (callback: (tab: chrome.tabs.Tab) => void) => void
    }
  }
}
