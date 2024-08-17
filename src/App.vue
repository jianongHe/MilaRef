<script setup></script>

<template>
  <div ref="view" class="container" @mouseup="handleMouseUp">
    <div class="menu" :class="{touchingMenu}" ref="menu" @mouseenter="handleMouseEnterMenu" @mouseleave="handleMouseLeaveMenu">
      <div class="bar" @mousedown="handleMouseDown">
        <div class="buttons">
          <div class="button">
            <img class="icon" @click="handleClose" src="./assets/icons/close.svg" />
          </div>
          <div class="button">
            <img class="icon" @click="handleMinimize" src="./assets/icons/minimize.svg" />
          </div>
          <div v-if="!isFullScreen" class="button">
            <img class="icon to-full" @click="handleMaximize" src="./assets/icons/maximize-2.svg" />
          </div>
          <div v-if="isFullScreen" class="button">
            <img class="icon to-win" @click="handleMaximize" src="./assets/icons/minimize-1.svg" />
          </div>
          <div class="button" v-if="!pin">
            <img class="icon pin" @click="handlePin" src="./assets/icons/pin.svg" />
          </div>
          <div class="button" v-if="pin">
            <img class="icon pin" @click="handlePin" src="./assets/icons/pin_slash.svg" />
          </div>
        </div>
        <div class="draggable"></div>
      </div>
    </div>
    <webview id="webview" ref="webview" :src="url" allowpopups @mouseenter="handleMouseEnterMain" @mouseleave="handleMouseLeaveMain"></webview>
  </div>

</template>

<script>

const IPC = window.electronAPI;

export default {
  name: 'App',
  data() {
    return {
      pin: false,
      touchingMenu: false,
      url: 'https://app.milanote.com',
      mouseListener: null,
      debounce: null,
      isFullScreen: false,
    }
  },
  mounted() {

    window.electronAPI.onMenuTouching((touching) => {
      this.touchingMenu = touching
    })

    const webview = this.$refs.webview;

    webview.addEventListener('did-finish-load', (event) => {
      // console.log('did-finish-load', event);
    });
    webview.addEventListener('will-navigate', (event) => {
      // console.log('will-navigate', event);
    });
    webview.addEventListener('did-navigate-in-page', (event) => {
      // console.log('did-navigate-in-page', event);
    });
    webview.addEventListener('will-frame-navigate', (event) => {
      // console.log('will-frame-navigate', event);
    });
    webview.addEventListener('did-navigate', (event) => {
      // console.log('did-navigate', event);
    });
  },
  methods: {
    handleMouseEnterMain() {
      console.log('handleMouseEnterMain')
      this.clearMenuListener()
    },
    handleMouseLeaveMain() {
      // console.log('handleMouseLeaveMain')
    },
    handleMouseDown() {
      console.log('handleMouseDown')
    },
    handleMouseUp() {
      console.log('handleMouseUp')
    },
    handleMouseEnterMenu() {
      this.touchingMenu = true
      this.startListenerForTouchingMenu()
    },
    async startListenerForTouchingMenu() {
      if (this.mouseListener) {
        return
      }

      IPC.ipcDump('START LISTENER')

      this.mouseListener = setInterval(async () => {
        const point = await IPC.ipcGetMousePosition()
        const menuSection = await IPC.ipcGetMenuSection(30)

        const isInMenuX = point.x > menuSection.xStart && point.x < menuSection.xEnd
        const isInMenuY = point.y > menuSection.yStart && point.y < menuSection.yEnd

        this.touchingMenu = isInMenuX && isInMenuY
      }, 10)
    },
    handleMouseLeaveMenu() {
      this.touchingMenu = false

      this.clearMenuListener()
    },
    clearMenuListener() {
      if (this.debounce) {
        clearTimeout(this.debounce)
      }

      this.debounce = setTimeout(() => {
        IPC.ipcDump('CLEAR LISTENER')
        clearInterval(this.mouseListener)
        this.mouseListener = null
        this.touchingMenu = false
      }, 1000)
    },
    handleMinimize() {
      console.log('handleMinimize')
      IPC.ipcMinimizeWindow()
    },
    handleMaximize() {
      console.log('handleMaximize')
      this.isFullScreen = !this.isFullScreen
      IPC.ipcMaximizeWindow(this.isFullScreen)
    },
    handleClose() {
      console.log('handleClose')
      IPC.ipcCloseWindow()
    },
    handlePin() {
      console.log('handlePin')
      this.pin = !this.pin
      IPC.ipcPinWindow(this.pin)
    },

  },
}
// 必须要检测到鼠标移入和移除menu的事件，这样才可以激活动画 ❌
// 要么就检测没有移出window且 鼠标没有在空余区域？ ❌
// 用js来计算？鼠标的xy


</script>

<style scoped>
.container {
  height: 100vh;
  width: 100vw;

  .menu {
    position: fixed;
    height: 30px;
    top: 0;
    left: 0;
    width: 100%;
    user-drag: none;
    z-index: 20;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;

    .bar {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
      height: 100%;
      transition: top ease 0.1s, opacity ease 0.3s;
      position: absolute;
      top: 0px;
      opacity: 0;
      background: gray;

      .buttons {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .button {
          position: relative;
          margin: 3px;
          width: 20px;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: default;

          .icon {
            position: relative;
            width: 100%;
            height: 100%;
            color: white;
            &.to-full {
              transform: scale(0.7);
            }
            &.to-win {
              transform: scale(0.8);
            }
            &.pin {
              transform: scale(0.7);
            }
          }
          &:before {
            content: '';
            position: absolute;
            height: 20px;
            width: 20px;
            background: rgba(206, 206, 206, 0.42);
            border-radius: 5px;
            transition: opacity 0.3s ease;

            opacity: 0;
          }
          &:hover::before {
            opacity: 1;
          }
        }
      }

      .draggable {
        width: 100%;
        height: 100%;
        transition: all 0.3s ease;
      }

    }

    &:not(.touchingMenu) {
      .bar {
        transition-delay: .3s;
      }
    }

    &.touchingMenu {

      .bar {
        transition-delay: 0s;
        opacity: 1;

        .draggable {
          -webkit-app-region: drag;
        }
      }
    }

  }

  webview {
    height: 100vh;
    width: 100vw;
  }
}


</style>
