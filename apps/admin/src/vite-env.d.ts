/// <reference types="vite/client" />

// CSS 模組類型聲明
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

// 圖片類型聲明
declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}
