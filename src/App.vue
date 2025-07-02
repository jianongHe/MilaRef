<template>
  <div ref="view" class="container">
    <div class="menu" :class="{touchingMenu, showToolBar: !showToolBar}" :style="{height: `${menuHeight}px`}" ref="menu" @mouseenter="handleMouseEnterMenu" @mouseleave="handleMouseLeaveMenu">
      <div class="bar">
        <div class="operations" :class="{ignoring: ignoreMouse}">
          <div class="button" @click="handleClose">
            <svg-icon class="icon" name="close" />
          </div>
          <div class="button" @click="handleMinimize">
            <svg-icon class="icon" name="minimize" />
          </div>
          <div class="button" v-if="!isFullScreen" @click="handleMaximize">
            <svg-icon class="icon to-full" name="to-full" />
          </div>
          <div class="button" v-else @click="handleMaximize">
            <svg-icon v-if="isFullScreen" class="icon to-win" name="to-win" />
          </div>
          <div class="button" v-if="!pin" @click="handlePin">
            <svg-icon class="icon pin" name="pin" />
          </div>
          <div class="button" v-else @click="handlePin">
            <svg-icon class="icon pin" name="pin_slash" />
          </div>
          <div class="slider">
            <n-slider :tooltip="false" v-model:value="transparent">
              <template #thumb>
                <svg-icon class="icon opacity" name="opacity" />
              </template>
            </n-slider>
          </div>
          <div>
            <div class="button mouse" v-if="!ignoreMouse" @click="handleIgnoreMouse">
              <svg-icon class="icon mouse" name="mouse-ignore" />
            </div>
            <div
              v-else
              class="button mouse"
              :class="{ 'with-progress': touchingIgnore }"
              @click="handleIgnoreMouse"
              @mouseenter="handleMouseEnterTheIgnore"
              @mouseleave="handleMouseLeaveTheIgnore"
            >
              <svg-icon class="icon mouse" name="mouse-normal" />
              <svg v-if="touchingIgnore" class="progress-ring" viewBox="0 0 40 40">
                <circle class="progress-path" cx="20" cy="20" r="19" fill="none" />
              </svg>
            </div>
          </div>
        </div>
        <div class="draggable"></div>
      </div>
    </div>

    <webview
        id="webview"
        ref="webview"
        class="webview"
        :src="url"
        :style="containerStyle"
        :partition="sessionPartition"
        @mouseenter="handleMouseEnterMain"
        allowpopups
    />
  </div>
</template>

<script>
import { NSlider } from 'naive-ui'
import SvgIcon from "./components/SvgIcon.vue";
import { MilaNoteStyleInjectionMixin } from "./mixins/MilanoteStyleInjection.js";

const IPC = window.electronAPI;

export default {
  name: 'App',
  mixins: [MilaNoteStyleInjectionMixin],
  components: {
    SvgIcon,
    NSlider
  },
  data() {
    return {
      menuHeight: 30,
      webview: null,
      pin: false,
      ignoreMouse: false,
      touchingMenu: false,
      url: 'https://app.milanote.com',
      mouseListener: null,
      debounce: null,
      isFullScreen: false,
      transparent: 100,
      isWindowFocused: false,
      touchingIgnore: false,
      ignoreTimeout: null
    }
  },
  computed: {
    containerStyle() {
      return {
        opacity: this.transparent / 100
      }
    },
    sessionPartition() {
      return 'persist:milanote'
    }
  },
  mounted() {

    const webview = this.$refs.webview;

    webview.addEventListener('dom-ready', (event) => {

      this.webview = webview

      IPC.ipcWebviewReady(webview.getWebContentsId())

      webview.addEventListener('console-message', (e) => {
        // IPC.ipcDump('CONSOLE MESSAGE FROM WEBVIEW:')
        // IPC.ipcDump(e.message)
      })

    });

  },
  created() {
    IPC.ipcOnFocus(() => this.isWindowFocused = true)
    IPC.ipcOnBlur(() => this.isWindowFocused = false)
  },
  methods: {

    handleMouseEnterMenu() {
      this.touchingMenu = true
      this.startListenerForTouchingMenu()
    },
    handleMouseEnterMain() {
      this.clearMenuListener()
    },
    async startListenerForTouchingMenu() {
      if (this.mouseListener) {
        return
      }

      this.mouseListener = setInterval(async () => {
        const point = await IPC.ipcGetMousePosition()
        const menuSection = await IPC.ipcGetMenuSection(this.menuHeight)

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
    async handleIgnoreMouse() {
      this.ignoreMouse = !this.ignoreMouse

      if(this.ignoreMouse) {
        this.transparent = this.transparent === 100 ? 90 : this.transparent

        !this.pin && this.handlePin()
      }

      IPC.ipcSetClickThroughShape(this.ignoreMouse)
    },
    handleMouseEnterTheIgnore() {
      IPC.ipcDump('mouse enter the ignore icon')
      if (!this.ignoreMouse) return

      this.touchingIgnore = true

      // 清除之前的定时器，避免重复触发
      if (this.ignoreTimeout) {
        clearTimeout(this.ignoreTimeout)
      }

      this.ignoreTimeout = setTimeout(() => {
        if (this.touchingIgnore && this.ignoreMouse) {
          IPC.ipcDump('Not ignore now')
          this.handleIgnoreMouse()
        }
        this.ignoreTimeout = null
      }, 1000)
    },

    handleMouseLeaveTheIgnore() {
      this.touchingIgnore = false
      if (this.ignoreTimeout) {
        clearTimeout(this.ignoreTimeout)
        this.ignoreTimeout = null
      }
    },
  },
}
</script>

<style scoped>
.container {
  height: 100vh;
  width: 100vw;
  background: transparent;

  .menu {
    position: fixed;
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
        .icon:deep(svg) {
          color: white;
        }
        .button {
          &:before {
            background: rgba(206, 206, 206, 0.42);
          }
        }
      }

      @media (prefers-color-scheme: light) {
        border-bottom: 1px solid #d9d9d9;
        .icon:deep(svg) {
          color: black;
        }
        .button {
          &:before {
            background: rgba(129, 129, 129, 0.42);
          }
        }
      }

      .operations {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .icon {
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
          &.mouse {
            transform: scale(0.8);
          }
          &.opacity {
            width: 20px;
            height: 20px;
            transform: scale(0.9);
          }
          &:deep(svg) {
            width: 100%;
            height: 100%;
          }
        }

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

          .with-progress {
            position: relative;
          }
        }

        .slider {
          width: 50px;
          &:deep(.n-slider-rail__fill) {
            background-color: #888888;
          }
        }
      }

      .operations.ignoring > .button {
        opacity: 0.3;
      }
      .operations.ignoring > .slider {
        opacity: 0.3;
      }

      .operations.ignoring > .button.mouse, .operations.ignoring > .slider.mouse {
        opacity: 1;
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

    &.showToolBar {
      .bar {
        background-color: #333333;
        transition-delay: 0s;
        opacity: 1;
        .draggable {
          -webkit-app-region: drag;
        }
      }
    }

  }

  .webview {
    height: 100vh;
    width: 100vw;
  }
}

.progress-ring {
  position: absolute;
  top: -2px;
  left: -2px;
  width: 24px;
  height: 24px;
  transform: rotate(-90deg); /* 从顶部开始 */
  pointer-events: none;
}
.progress-path {
  stroke: white;
  stroke-width: 1;
  stroke-dasharray: 120;
  stroke-dashoffset: 120;
  animation: progress-ring-fill 1s linear forwards;
}
@keyframes progress-ring-fill {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
