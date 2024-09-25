const IPC = window.electronAPI;

const headerFloatingKey = Symbol()
const hideHeaderKey = Symbol()
const hideToolbarKey = Symbol()
const toolbarFloatingKey = Symbol()
const viewportKey = Symbol()
const toolbarAnimationKey = Symbol()
const headerAnimationKey = Symbol()
const unsortedPositionKey = Symbol()
const unsortedAnimationKey = Symbol()
const unsortedPanelKey = Symbol()
const hideUnsortedKey = Symbol()

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
                [unsortedPositionKey]: '.InboxClosed{position: absolute;top: 20px !important;',
                [unsortedAnimationKey]: '.InboxClosed{transition: top,opacity 0.3s ease !important;} .inbox-header{transition: padding-top 0.3s ease !important;}',
                [unsortedPanelKey]: '.inbox-header{padding-top: 0px}',
                [hideUnsortedKey]: '.InboxClosed{opacity: 0;pointer-events: none;}'
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
                this.removeCSS(hideHeaderKey)
                this.removeCSS(hideToolbarKey)
            }

            this.correctUnsortedPosition()
        },
        isWindowFocused(focused) {
            console.log('focused')
            console.log(focused)
            focused ? this.removeCSS(hideUnsortedKey) : this.insertCSS(hideUnsortedKey)
        },
        async headerHeight(headerHeight) {

            const toolbarTopFloat = this.menuHeight + headerHeight
            this.CSSInjections[toolbarFloatingKey] = `.ToolbarContainer{position: absolute; top: ${toolbarTopFloat}px;height:100%;}`
            await this.removeCSS(toolbarFloatingKey)
            await this.insertCSS(toolbarFloatingKey)

            await this.correctUnsortedPosition()

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
            !this.insertedCSSKeys[unsortedPositionKey] && this.insertCSS(unsortedPositionKey)
            !this.insertedCSSKeys[unsortedAnimationKey] && this.insertCSS(unsortedAnimationKey)
            !this.insertedCSSKeys[unsortedPanelKey] && this.insertCSS(unsortedPanelKey)
            // !this.insertedCSSKeys[hideUnsortedKey] && this.insertCSS(hideUnsortedKey)
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
        async removeCSS(key) {
            await this.webview?.removeInsertedCSS(this.insertedCSSKeys[key])
            this.insertedCSSKeys[key] = null
        },
        async correctUnsortedPosition() {
            const unsortedTopFloat = this.showToolBar
                ? this.menuHeight
                : this.menuHeight + this.headerHeight

            this.CSSInjections[unsortedPositionKey] = `.InboxClosed{position: absolute;top: ${unsortedTopFloat + 20}px !important;`
            await this.removeCSS(unsortedPositionKey)
            await this.insertCSS(unsortedPositionKey)

            this.CSSInjections[unsortedPanelKey] = `.inbox-header{padding-top: ${unsortedTopFloat}px}`
            await this.removeCSS(unsortedPanelKey)
            await this.insertCSS(unsortedPanelKey)

        }
    }
};
