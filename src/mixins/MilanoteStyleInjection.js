const IPC = window.electronAPI;

const headerFloatingKey = Symbol()
const hideHeaderKey = Symbol()
const hideToolbarKey = Symbol()
const toolbarFloatingKey = Symbol()
const viewportKey = Symbol()
const toolbarAnimationKey = Symbol()
const headerAnimationKey = Symbol()

export const MilaNoteStyleInjectionMixin = {
    data() {
        return {
            headerHeight: null,
            showToolBar: true,
            CSSInjections: {
                [hideHeaderKey]: 'header.AppHeader{visibility: hidden; opacity: 0;pointer-events: none;}',
                [hideToolbarKey]: '#toolbar{visibility: hidden; opacity: 0;}',
                [viewportKey]: '#canvas-viewport{scrollbar-width: none;}    .WorkspaceToolsHeader{}',
                [toolbarAnimationKey]: '.ToolbarContainer{transition:all ease 0.3s;} #toolbar{transition:all ease 0.3s;}',
                [headerAnimationKey]: 'header.AppHeader{transition:all ease 0.3s;}',
                [headerFloatingKey]: 'header.AppHeader{position: absolute; top: 30px; width: 100%;}',
                [toolbarFloatingKey]: '.ToolbarContainer{position: absolute; top: 114px;height:100%;}',
            },
            insertedCSSKeys: {}
        };
    },
    watch: {
        showToolBar(show) {
            if (show) {
                this.insertCSS(hideHeaderKey)
                this.insertCSS(hideToolbarKey)
            } else {
                this.removeInsertedCSS(hideHeaderKey)
                this.removeInsertedCSS(hideToolbarKey)
            }
        },
        async headerHeight() {
            const topFloat = this.menuHeight + this.headerHeight

            IPC.ipcDump('TOP FLOAT CHANGE')
            IPC.ipcDump(topFloat)

            this.CSSInjections[toolbarFloatingKey] = `.ToolbarContainer{position: absolute; top: ${topFloat}px;height:100%;}`

            await this.removeInsertedCSS(toolbarFloatingKey)
            await this.insertCSS(toolbarFloatingKey)
        },
        webview(hasWebview) {
            if (!hasWebview) return

            !this.insertedCSSKeys[hideHeaderKey] && this.insertCSS(hideHeaderKey)
            !this.insertedCSSKeys[hideToolbarKey] && this.insertCSS(hideToolbarKey)
            !this.insertedCSSKeys[viewportKey] && this.insertCSS(viewportKey)
            !this.insertedCSSKeys[toolbarAnimationKey] && this.insertCSS(toolbarAnimationKey)
            !this.insertedCSSKeys[headerAnimationKey] && this.insertCSS(headerAnimationKey)
            !this.insertedCSSKeys[headerFloatingKey] && this.insertCSS(headerFloatingKey)
            !this.insertedCSSKeys[toolbarFloatingKey] && this.insertCSS(toolbarFloatingKey)
        }
    },
    mounted() {
        IPC.ipcOnToggleToolBar(() => this.showToolBar = !this.showToolBar)
    },
    created() {
        IPC.ipcOnHeaderHeightChanged(height => this.headerHeight = height)
    },
    methods: {
        async insertCSS(key) {
            this.insertedCSSKeys[key] = this.insertedCSSKeys[key] || await this.webview?.insertCSS(this.CSSInjections[key])
        },
        async removeInsertedCSS(key) {
            await this.webview?.removeInsertedCSS(this.insertedCSSKeys[key])
            this.insertedCSSKeys[key] = null
        },
    }
};
