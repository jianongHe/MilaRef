<script setup>
import SvgIcon from "./components/SvgIcon.vue";
</script>

<template>
  <div ref="view" class="container" @mouseup="handleMouseUp">
    <div class="menu" :class="{touchingMenu}" ref="menu" @mouseenter="handleMouseEnterMenu" @mouseleave="handleMouseLeaveMenu">
      <div class="bar" @mousedown="handleMouseDown">
        <div class="buttons">
          <div class="button">
            <svg-icon class="icon" @click="handleClose" name="close" />
          </div>
          <div class="button">
            <svg-icon @click="handleMinimize" class="icon" name="minimize" />
          </div>
          <div class="button" v-if="!isFullScreen">
            <svg-icon  @click="handleMaximize" class="icon to-full" name="to-full" />
          </div>
          <div class="button" v-else>
            <svg-icon v-if="isFullScreen" @click="handleMaximize" class="icon to-win" name="to-win" />
          </div>
          <div class="button" v-if="!pin">
            <svg-icon  @click="handlePin" class="icon pin" name="pin" />
          </div>
          <div class="button" v-else>
            <svg-icon  @click="handlePin" class="icon pin" name="pin_slash" />
          </div>
        </div>
        <div class="draggable"></div>
      </div>
    </div>
    <webview id="webview" ref="webview" :src="url" allowpopups @mouseenter="handleMouseEnterMain" @mouseleave="handleMouseLeaveMain" />
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
      IPC.ipcMinimizeWindow()
    },
    handleMaximize() {
      this.isFullScreen = !this.isFullScreen
      IPC.ipcMaximizeWindow(this.isFullScreen)
    },
    handleClose() {
      IPC.ipcCloseWindow()
    },
    handlePin() {
      this.pin = !this.pin
      IPC.ipcPinWindow(this.pin)
    },

  },
}
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
      backdrop-filter: blur(6px);

      @media (prefers-color-scheme: dark) {
        border-bottom: 1px solid #888888;
        .button {
          .icon:deep(svg) {
            color: white;
          }
          &:before {
            background: rgba(206, 206, 206, 0.42);
          }
        }
      }

      @media (prefers-color-scheme: light) {
        border-bottom: 1px solid #d9d9d9;
        .button {
          .icon:deep(svg) {
            color: black;
          }
          &:before {
            background: rgba(129, 129, 129, 0.42);
          }
        }
      }

      .buttons {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .button {
          position: relative;
          margin: 3px;
          width: 20px;
          height: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: default;
          transform: none;

          .icon {
            position: relative;
            width: 100%;
            height: 100%;
            &.to-full {
              transform: scale(0.7);
            }
            &.to-win {
              transform: scale(0.8);
            }
            &.pin {
              transform: scale(0.7);
            }
            &:deep(svg) {
              width: 100%;
              height: 100%;
            }
          }
          &:before {
            content: '';
            position: absolute;
            height: 20px;
            width: 20px;
            border-radius: 5px;
            transition: opacity 0.3s ease;
            opacity: 0;
            transform: none;
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
