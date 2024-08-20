const IPC = window.electronAPI;

const headerFloatingKey = Symbol()
const hideHeaderKey = Symbol()
const hideToolbarKey = Symbol()
const toolbarFloatingKey = Symbol()
const viewportKey = Symbol()
const minifyToolbar = Symbol()

const CSSInjections = {
    [hideHeaderKey]: 'header.AppHeader{display: none;}',
    [hideToolbarKey]: '#toolbar{display: none}',
    // [minifyToolbar]: '.ElementToolDraggable {width: 20px;} .tool-list{width: 30px;}',
    [minifyToolbar]: '',
    [viewportKey]: '#canvas-viewport{scrollbar-width: none;}',
    [headerFloatingKey]: 'header.AppHeader{position: absolute; top: 30px; width: 100%;}',
    [toolbarFloatingKey]: '#toolbar{position: absolute; top: 180px; left: 0;}',
}

export const MilaNoteStyleInjectionMixin = {
    data() {
        return {
            showToolBar: true,
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
        webview(hasWebview) {
            if (!hasWebview) return

            !this.insertedCSSKeys[hideHeaderKey] && this.insertCSS(hideHeaderKey)
            !this.insertedCSSKeys[hideToolbarKey] && this.insertCSS(hideToolbarKey)
            !this.insertedCSSKeys[viewportKey] && this.insertCSS(viewportKey)
            !this.insertedCSSKeys[headerFloatingKey] && this.insertCSS(headerFloatingKey)
            !this.insertedCSSKeys[toolbarFloatingKey] && this.insertCSS(toolbarFloatingKey)
            !this.insertedCSSKeys[minifyToolbar] && this.insertCSS(minifyToolbar)
        }
    },
    mounted() {
        IPC.ipcOnToggleToolBar(() => this.showToolBar = !this.showToolBar)
    },
    methods: {
        async insertCSS(key) {
            this.insertedCSSKeys[key] = this.insertedCSSKeys[key] || await this.webview?.insertCSS(CSSInjections[key])
        },
        async removeInsertedCSS(key) {
            await this.webview?.removeInsertedCSS(this.insertedCSSKeys[key])
            this.insertedCSSKeys[key] = null
        },
    }
};
