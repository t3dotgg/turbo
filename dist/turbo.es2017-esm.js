/*
Turbo 7.0.0-beta.1
Copyright © 2020 Basecamp, LLC
 */
(function () {
    if (window.Reflect === undefined || window.customElements === undefined ||
        window.customElements.polyfillWrapFlushCallback) {
        return;
    }
    const BuiltInHTMLElement = HTMLElement;
    const wrapperForTheName = {
        'HTMLElement': function HTMLElement() {
            return Reflect.construct(BuiltInHTMLElement, [], this.constructor);
        }
    };
    window.HTMLElement =
        wrapperForTheName['HTMLElement'];
    HTMLElement.prototype = BuiltInHTMLElement.prototype;
    HTMLElement.prototype.constructor = HTMLElement;
    Object.setPrototypeOf(HTMLElement, BuiltInHTMLElement);
})();

function array(values) {
    return Array.prototype.slice.call(values);
}
const closest = (() => {
    const html = document.documentElement;
    const match = html.matches
        || html.webkitMatchesSelector
        || html.msMatchesSelector
        || html.mozMatchesSelector;
    const closest = html.closest || function (selector) {
        let element = this;
        while (element) {
            if (match.call(element, selector)) {
                return element;
            }
            else {
                element = element.parentElement;
            }
        }
    };
    return function (element, selector) {
        return closest.call(element, selector);
    };
})();
function defer(callback) {
    setTimeout(callback, 1);
}
function dispatch(eventName, { target, cancelable, data } = {}) {
    const event = document.createEvent("Events");
    event.initEvent(eventName, true, cancelable == true);
    event.data = data || {};
    if (event.cancelable && !preventDefaultSupported) {
        const { preventDefault } = event;
        event.preventDefault = function () {
            if (!this.defaultPrevented) {
                Object.defineProperty(this, "defaultPrevented", { get: () => true });
            }
            preventDefault.call(this);
        };
    }
    (target || document).dispatchEvent(event);
    return event;
}
function nextAnimationFrame() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
const preventDefaultSupported = (() => {
    const event = document.createEvent("Events");
    event.initEvent("test", true, true);
    event.preventDefault();
    return event.defaultPrevented;
})();
function unindent(strings, ...values) {
    const lines = trimLeft(interpolate(strings, values)).split("\n");
    const match = lines[0].match(/^\s+/);
    const indent = match ? match[0].length : 0;
    return lines.map(line => line.slice(indent)).join("\n");
}
function trimLeft(string) {
    return string.replace(/^\n/, "");
}
function interpolate(strings, values) {
    return strings.reduce((result, string, i) => {
        const value = values[i] == undefined ? "" : values[i];
        return result + string + value;
    }, "");
}
function uuid() {
    return Array.apply(null, { length: 36 }).map((_, i) => {
        if (i == 8 || i == 13 || i == 18 || i == 23) {
            return "-";
        }
        else if (i == 14) {
            return "4";
        }
        else if (i == 19) {
            return (Math.floor(Math.random() * 4) + 8).toString(16);
        }
        else {
            return Math.floor(Math.random() * 15).toString(16);
        }
    }).join("");
}

(() => {
    let element = document.currentScript;
    if (!element)
        return;
    if (element.hasAttribute("data-turbo-suppress-warning"))
        return;
    while (element = element.parentElement) {
        if (element == document.body) {
            return console.warn(unindent `
        You are loading Turbo from a <script> element inside the <body> element. This is probably not what you meant to do!

        Load your application’s JavaScript bundle inside the <head> element instead. <script> elements in <body> are evaluated with each page change.

        For more information, see: https://turbo.hotwire.dev/handbook/building#working-with-script-elements

        ——
        Suppress this warning by adding a "data-turbo-suppress-warning" attribute to: %s
      `, element.outerHTML);
        }
    }
})();

class ProgressBar {
    constructor() {
        this.hiding = false;
        this.value = 0;
        this.visible = false;
        this.trickle = () => {
            this.setValue(this.value + Math.random() / 100);
        };
        this.stylesheetElement = this.createStylesheetElement();
        this.progressElement = this.createProgressElement();
        this.installStylesheetElement();
        this.setValue(0);
    }
    static get defaultCSS() {
        return unindent `
      .turbo-progress-bar {
        position: fixed;
        display: block;
        top: 0;
        left: 0;
        height: 3px;
        background: #0076ff;
        z-index: 9999;
        transition:
          width ${ProgressBar.animationDuration}ms ease-out,
          opacity ${ProgressBar.animationDuration / 2}ms ${ProgressBar.animationDuration / 2}ms ease-in;
        transform: translate3d(0, 0, 0);
      }
    `;
    }
    show() {
        if (!this.visible) {
            this.visible = true;
            this.installProgressElement();
            this.startTrickling();
        }
    }
    hide() {
        if (this.visible && !this.hiding) {
            this.hiding = true;
            this.fadeProgressElement(() => {
                this.uninstallProgressElement();
                this.stopTrickling();
                this.visible = false;
                this.hiding = false;
            });
        }
    }
    setValue(value) {
        this.value = value;
        this.refresh();
    }
    installStylesheetElement() {
        document.head.insertBefore(this.stylesheetElement, document.head.firstChild);
    }
    installProgressElement() {
        this.progressElement.style.width = "0";
        this.progressElement.style.opacity = "1";
        document.documentElement.insertBefore(this.progressElement, document.body);
        this.refresh();
    }
    fadeProgressElement(callback) {
        this.progressElement.style.opacity = "0";
        setTimeout(callback, ProgressBar.animationDuration * 1.5);
    }
    uninstallProgressElement() {
        if (this.progressElement.parentNode) {
            document.documentElement.removeChild(this.progressElement);
        }
    }
    startTrickling() {
        if (!this.trickleInterval) {
            this.trickleInterval = window.setInterval(this.trickle, ProgressBar.animationDuration);
        }
    }
    stopTrickling() {
        window.clearInterval(this.trickleInterval);
        delete this.trickleInterval;
    }
    refresh() {
        requestAnimationFrame(() => {
            this.progressElement.style.width = `${10 + (this.value * 90)}%`;
        });
    }
    createStylesheetElement() {
        const element = document.createElement("style");
        element.type = "text/css";
        element.textContent = ProgressBar.defaultCSS;
        return element;
    }
    createProgressElement() {
        const element = document.createElement("div");
        element.className = "turbo-progress-bar";
        return element;
    }
}
ProgressBar.animationDuration = 300;

class Location {
    constructor(url) {
        const linkWithAnchor = document.createElement("a");
        linkWithAnchor.href = url;
        this.absoluteURL = linkWithAnchor.href;
        const anchorLength = linkWithAnchor.hash.length;
        if (anchorLength < 2) {
            this.requestURL = this.absoluteURL;
        }
        else {
            this.requestURL = this.absoluteURL.slice(0, -anchorLength);
            this.anchor = linkWithAnchor.hash.slice(1);
        }
    }
    static get currentLocation() {
        return this.wrap(window.location.toString());
    }
    static wrap(locatable) {
        if (typeof locatable == "string") {
            return new this(locatable);
        }
        else if (locatable != null) {
            return locatable;
        }
    }
    getOrigin() {
        return this.absoluteURL.split("/", 3).join("/");
    }
    getPath() {
        return (this.requestURL.match(/\/\/[^/]*(\/[^?;]*)/) || [])[1] || "/";
    }
    getPathComponents() {
        return this.getPath().split("/").slice(1);
    }
    getLastPathComponent() {
        return this.getPathComponents().slice(-1)[0];
    }
    getExtension() {
        return (this.getLastPathComponent().match(/\.[^.]*$/) || [])[0] || "";
    }
    isHTML() {
        return !!this.getExtension().match(/^(?:|\.(?:htm|html|xhtml))$/);
    }
    isPrefixedBy(location) {
        const prefixURL = getPrefixURL(location);
        return this.isEqualTo(location) || stringStartsWith(this.absoluteURL, prefixURL);
    }
    isEqualTo(location) {
        return location && this.absoluteURL === location.absoluteURL;
    }
    toCacheKey() {
        return this.requestURL;
    }
    toJSON() {
        return this.absoluteURL;
    }
    toString() {
        return this.absoluteURL;
    }
    valueOf() {
        return this.absoluteURL;
    }
}
function getPrefixURL(location) {
    return addTrailingSlash(location.getOrigin() + location.getPath());
}
function addTrailingSlash(url) {
    return stringEndsWith(url, "/") ? url : url + "/";
}
function stringStartsWith(string, prefix) {
    return string.slice(0, prefix.length) === prefix;
}
function stringEndsWith(string, suffix) {
    return string.slice(-suffix.length) === suffix;
}

class FetchResponse {
    constructor(response) {
        this.response = response;
    }
    get succeeded() {
        return this.response.ok;
    }
    get failed() {
        return !this.succeeded;
    }
    get redirected() {
        return this.response.redirected;
    }
    get location() {
        return Location.wrap(this.response.url);
    }
    get isHTML() {
        return this.contentType && this.contentType.match(/^text\/html|^application\/xhtml\+xml/);
    }
    get statusCode() {
        return this.response.status;
    }
    get contentType() {
        return this.header("Content-Type");
    }
    get responseText() {
        return this.response.text();
    }
    get responseHTML() {
        if (this.isHTML) {
            return this.response.text();
        }
        else {
            return Promise.resolve(undefined);
        }
    }
    header(name) {
        return this.response.headers.get(name);
    }
}

var FetchMethod;
(function (FetchMethod) {
    FetchMethod[FetchMethod["get"] = 0] = "get";
    FetchMethod[FetchMethod["post"] = 1] = "post";
    FetchMethod[FetchMethod["put"] = 2] = "put";
    FetchMethod[FetchMethod["patch"] = 3] = "patch";
    FetchMethod[FetchMethod["delete"] = 4] = "delete";
})(FetchMethod || (FetchMethod = {}));
function fetchMethodFromString(method) {
    switch (method.toLowerCase()) {
        case "get": return FetchMethod.get;
        case "post": return FetchMethod.post;
        case "put": return FetchMethod.put;
        case "patch": return FetchMethod.patch;
        case "delete": return FetchMethod.delete;
    }
}
class FetchRequest {
    constructor(delegate, method, location, body) {
        this.abortController = new AbortController;
        this.delegate = delegate;
        this.method = method;
        this.location = location;
        this.body = body;
    }
    get url() {
        const url = this.location.absoluteURL;
        const query = this.params.toString();
        if (this.isIdempotent && query.length) {
            return [url, query].join(url.includes("?") ? "&" : "?");
        }
        else {
            return url;
        }
    }
    get params() {
        return this.entries.reduce((params, [name, value]) => {
            params.append(name, value.toString());
            return params;
        }, new URLSearchParams);
    }
    get entries() {
        return this.body ? Array.from(this.body.entries()) : [];
    }
    cancel() {
        this.abortController.abort();
    }
    async perform() {
        const { fetchOptions } = this;
        dispatch("turbo:before-fetch-request", { data: { fetchOptions } });
        try {
            this.delegate.requestStarted(this);
            const response = await fetch(this.url, fetchOptions);
            return await this.receive(response);
        }
        catch (error) {
            this.delegate.requestErrored(this, error);
            throw error;
        }
        finally {
            this.delegate.requestFinished(this);
        }
    }
    async receive(response) {
        const fetchResponse = new FetchResponse(response);
        const event = dispatch("turbo:before-fetch-response", { cancelable: true, data: { fetchResponse } });
        if (event.defaultPrevented) {
            this.delegate.requestPreventedHandlingResponse(this, fetchResponse);
        }
        else if (fetchResponse.succeeded) {
            this.delegate.requestSucceededWithResponse(this, fetchResponse);
        }
        else {
            this.delegate.requestFailedWithResponse(this, fetchResponse);
        }
        return fetchResponse;
    }
    get fetchOptions() {
        return {
            method: FetchMethod[this.method].toUpperCase(),
            credentials: "same-origin",
            headers: this.headers,
            redirect: "follow",
            body: this.isIdempotent ? undefined : this.body,
            signal: this.abortSignal
        };
    }
    get isIdempotent() {
        return this.method == FetchMethod.get;
    }
    get headers() {
        return Object.assign({ "Accept": "text/html, application/xhtml+xml" }, this.additionalHeaders);
    }
    get additionalHeaders() {
        if (typeof this.delegate.additionalHeadersForRequest == "function") {
            return this.delegate.additionalHeadersForRequest(this);
        }
        else {
            return {};
        }
    }
    get abortSignal() {
        return this.abortController.signal;
    }
}

class HeadDetails {
    constructor(children) {
        this.detailsByOuterHTML = children.reduce((result, element) => {
            const { outerHTML } = element;
            const details = outerHTML in result
                ? result[outerHTML]
                : {
                    type: elementType(element),
                    tracked: elementIsTracked(element),
                    elements: []
                };
            return Object.assign(Object.assign({}, result), { [outerHTML]: Object.assign(Object.assign({}, details), { elements: [...details.elements, element] }) });
        }, {});
    }
    static fromHeadElement(headElement) {
        const children = headElement ? array(headElement.children) : [];
        return new this(children);
    }
    getTrackedElementSignature() {
        return Object.keys(this.detailsByOuterHTML)
            .filter(outerHTML => this.detailsByOuterHTML[outerHTML].tracked)
            .join("");
    }
    getScriptElementsNotInDetails(headDetails) {
        return this.getElementsMatchingTypeNotInDetails("script", headDetails);
    }
    getStylesheetElementsNotInDetails(headDetails) {
        return this.getElementsMatchingTypeNotInDetails("stylesheet", headDetails);
    }
    getElementsMatchingTypeNotInDetails(matchedType, headDetails) {
        return Object.keys(this.detailsByOuterHTML)
            .filter(outerHTML => !(outerHTML in headDetails.detailsByOuterHTML))
            .map(outerHTML => this.detailsByOuterHTML[outerHTML])
            .filter(({ type }) => type == matchedType)
            .map(({ elements: [element] }) => element);
    }
    getProvisionalElements() {
        return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
            const { type, tracked, elements } = this.detailsByOuterHTML[outerHTML];
            if (type == null && !tracked) {
                return [...result, ...elements];
            }
            else if (elements.length > 1) {
                return [...result, ...elements.slice(1)];
            }
            else {
                return result;
            }
        }, []);
    }
    getMetaValue(name) {
        const element = this.findMetaElementByName(name);
        return element
            ? element.getAttribute("content")
            : null;
    }
    findMetaElementByName(name) {
        return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
            const { elements: [element] } = this.detailsByOuterHTML[outerHTML];
            return elementIsMetaElementWithName(element, name) ? element : result;
        }, undefined);
    }
}
function elementType(element) {
    if (elementIsScript(element)) {
        return "script";
    }
    else if (elementIsStylesheet(element)) {
        return "stylesheet";
    }
}
function elementIsTracked(element) {
    return element.getAttribute("data-turbo-track") == "reload";
}
function elementIsScript(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "script";
}
function elementIsStylesheet(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "style" || (tagName == "link" && element.getAttribute("rel") == "stylesheet");
}
function elementIsMetaElementWithName(element, name) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "meta" && element.getAttribute("name") == name;
}

class Snapshot {
    constructor(headDetails, bodyElement) {
        this.headDetails = headDetails;
        this.bodyElement = bodyElement;
    }
    static wrap(value) {
        if (value instanceof this) {
            return value;
        }
        else if (typeof value == "string") {
            return this.fromHTMLString(value);
        }
        else {
            return this.fromHTMLElement(value);
        }
    }
    static fromHTMLString(html) {
        const { documentElement } = new DOMParser().parseFromString(html, "text/html");
        return this.fromHTMLElement(documentElement);
    }
    static fromHTMLElement(htmlElement) {
        const headElement = htmlElement.querySelector("head");
        const bodyElement = htmlElement.querySelector("body") || document.createElement("body");
        const headDetails = HeadDetails.fromHeadElement(headElement);
        return new this(headDetails, bodyElement);
    }
    clone() {
        const { bodyElement } = Snapshot.fromHTMLString(this.bodyElement.outerHTML);
        return new Snapshot(this.headDetails, bodyElement);
    }
    getRootLocation() {
        const root = this.getSetting("root", "/");
        return new Location(root);
    }
    getCacheControlValue() {
        return this.getSetting("cache-control");
    }
    getElementForAnchor(anchor) {
        try {
            return this.bodyElement.querySelector(`[id='${anchor}'], a[name='${anchor}']`);
        }
        catch (_a) {
            return null;
        }
    }
    getPermanentElements() {
        return array(this.bodyElement.querySelectorAll("[id][data-turbo-permanent]"));
    }
    getPermanentElementById(id) {
        return this.bodyElement.querySelector(`#${id}[data-turbo-permanent]`);
    }
    getPermanentElementsPresentInSnapshot(snapshot) {
        return this.getPermanentElements().filter(({ id }) => snapshot.getPermanentElementById(id));
    }
    findFirstAutofocusableElement() {
        return this.bodyElement.querySelector("[autofocus]");
    }
    hasAnchor(anchor) {
        return this.getElementForAnchor(anchor) != null;
    }
    isPreviewable() {
        return this.getCacheControlValue() != "no-preview";
    }
    isCacheable() {
        return this.getCacheControlValue() != "no-cache";
    }
    isVisitable() {
        return this.getSetting("visit-control") != "reload";
    }
    getSetting(name, defaultValue) {
        const value = this.headDetails.getMetaValue(`turbo-${name}`);
        return value == null ? defaultValue : value;
    }
}

var TimingMetric;
(function (TimingMetric) {
    TimingMetric["visitStart"] = "visitStart";
    TimingMetric["requestStart"] = "requestStart";
    TimingMetric["requestEnd"] = "requestEnd";
    TimingMetric["visitEnd"] = "visitEnd";
})(TimingMetric || (TimingMetric = {}));
var VisitState;
(function (VisitState) {
    VisitState["initialized"] = "initialized";
    VisitState["started"] = "started";
    VisitState["canceled"] = "canceled";
    VisitState["failed"] = "failed";
    VisitState["completed"] = "completed";
})(VisitState || (VisitState = {}));
const defaultOptions = {
    action: "advance",
    historyChanged: false
};
var SystemStatusCode;
(function (SystemStatusCode) {
    SystemStatusCode[SystemStatusCode["networkFailure"] = 0] = "networkFailure";
    SystemStatusCode[SystemStatusCode["timeoutFailure"] = -1] = "timeoutFailure";
    SystemStatusCode[SystemStatusCode["contentTypeMismatch"] = -2] = "contentTypeMismatch";
})(SystemStatusCode || (SystemStatusCode = {}));
class Visit {
    constructor(delegate, location, restorationIdentifier, options = {}) {
        this.identifier = uuid();
        this.timingMetrics = {};
        this.followedRedirect = false;
        this.historyChanged = false;
        this.scrolled = false;
        this.snapshotCached = false;
        this.state = VisitState.initialized;
        this.performScroll = () => {
            if (!this.scrolled) {
                if (this.action == "restore") {
                    this.scrollToRestoredPosition() || this.scrollToTop();
                }
                else {
                    this.scrollToAnchor() || this.scrollToTop();
                }
                this.scrolled = true;
            }
        };
        this.delegate = delegate;
        this.location = location;
        this.restorationIdentifier = restorationIdentifier || uuid();
        const { action, historyChanged, referrer, snapshotHTML, response } = Object.assign(Object.assign({}, defaultOptions), options);
        this.action = action;
        this.historyChanged = historyChanged;
        this.referrer = referrer;
        this.snapshotHTML = snapshotHTML;
        this.response = response;
    }
    get adapter() {
        return this.delegate.adapter;
    }
    get view() {
        return this.delegate.view;
    }
    get history() {
        return this.delegate.history;
    }
    get restorationData() {
        return this.history.getRestorationDataForIdentifier(this.restorationIdentifier);
    }
    start() {
        if (this.state == VisitState.initialized) {
            this.recordTimingMetric(TimingMetric.visitStart);
            this.state = VisitState.started;
            this.adapter.visitStarted(this);
            this.delegate.visitStarted(this);
        }
    }
    cancel() {
        if (this.state == VisitState.started) {
            if (this.request) {
                this.request.cancel();
            }
            this.cancelRender();
            this.state = VisitState.canceled;
        }
    }
    complete() {
        if (this.state == VisitState.started) {
            this.recordTimingMetric(TimingMetric.visitEnd);
            this.state = VisitState.completed;
            this.adapter.visitCompleted(this);
            this.delegate.visitCompleted(this);
        }
    }
    fail() {
        if (this.state == VisitState.started) {
            this.state = VisitState.failed;
            this.adapter.visitFailed(this);
        }
    }
    changeHistory() {
        if (!this.historyChanged) {
            const actionForHistory = this.location.isEqualTo(this.referrer) ? "replace" : this.action;
            const method = this.getHistoryMethodForAction(actionForHistory);
            this.history.update(method, this.location, this.restorationIdentifier);
            this.historyChanged = true;
        }
    }
    issueRequest() {
        if (this.hasPreloadedResponse()) {
            this.simulateRequest();
        }
        else if (this.shouldIssueRequest() && !this.request) {
            this.request = new FetchRequest(this, FetchMethod.get, this.location);
            this.request.perform();
        }
    }
    simulateRequest() {
        if (this.response) {
            this.startRequest();
            this.recordResponse();
            this.finishRequest();
        }
    }
    startRequest() {
        this.recordTimingMetric(TimingMetric.requestStart);
        this.adapter.visitRequestStarted(this);
    }
    recordResponse(response = this.response) {
        this.response = response;
        if (response) {
            const { statusCode } = response;
            if (isSuccessful(statusCode)) {
                this.adapter.visitRequestCompleted(this);
            }
            else {
                this.adapter.visitRequestFailedWithStatusCode(this, statusCode);
            }
        }
    }
    finishRequest() {
        this.recordTimingMetric(TimingMetric.requestEnd);
        this.adapter.visitRequestFinished(this);
    }
    loadResponse() {
        if (this.response) {
            const { statusCode, responseHTML } = this.response;
            this.render(() => {
                this.cacheSnapshot();
                if (isSuccessful(statusCode) && responseHTML != null) {
                    this.view.render({ snapshot: Snapshot.fromHTMLString(responseHTML) }, this.performScroll);
                    this.adapter.visitRendered(this);
                    this.complete();
                }
                else {
                    this.view.render({ error: responseHTML }, this.performScroll);
                    this.adapter.visitRendered(this);
                    this.fail();
                }
            });
        }
    }
    getCachedSnapshot() {
        const snapshot = this.view.getCachedSnapshotForLocation(this.location) || this.getPreloadedSnapshot();
        if (snapshot && (!this.location.anchor || snapshot.hasAnchor(this.location.anchor))) {
            if (this.action == "restore" || snapshot.isPreviewable()) {
                return snapshot;
            }
        }
    }
    getPreloadedSnapshot() {
        if (this.snapshotHTML) {
            return Snapshot.wrap(this.snapshotHTML);
        }
    }
    hasCachedSnapshot() {
        return this.getCachedSnapshot() != null;
    }
    loadCachedSnapshot() {
        const snapshot = this.getCachedSnapshot();
        if (snapshot) {
            const isPreview = this.shouldIssueRequest();
            this.render(() => {
                this.cacheSnapshot();
                this.view.render({ snapshot, isPreview }, this.performScroll);
                this.adapter.visitRendered(this);
                if (!isPreview) {
                    this.complete();
                }
            });
        }
    }
    followRedirect() {
        if (this.redirectedToLocation && !this.followedRedirect) {
            this.location = this.redirectedToLocation;
            this.history.replace(this.redirectedToLocation, this.restorationIdentifier);
            this.followedRedirect = true;
        }
    }
    requestStarted() {
        this.startRequest();
    }
    requestPreventedHandlingResponse(request, response) {
    }
    async requestSucceededWithResponse(request, response) {
        const responseHTML = await response.responseHTML;
        if (responseHTML == undefined) {
            this.recordResponse({ statusCode: SystemStatusCode.contentTypeMismatch });
        }
        else {
            this.redirectedToLocation = response.redirected ? response.location : undefined;
            this.recordResponse({ statusCode: response.statusCode, responseHTML });
        }
    }
    async requestFailedWithResponse(request, response) {
        const responseHTML = await response.responseHTML;
        if (responseHTML == undefined) {
            this.recordResponse({ statusCode: SystemStatusCode.contentTypeMismatch });
        }
        else {
            this.recordResponse({ statusCode: response.statusCode, responseHTML });
        }
    }
    requestErrored(request, error) {
        this.recordResponse({ statusCode: SystemStatusCode.networkFailure });
    }
    requestFinished() {
        this.finishRequest();
    }
    scrollToRestoredPosition() {
        const { scrollPosition } = this.restorationData;
        if (scrollPosition) {
            this.view.scrollToPosition(scrollPosition);
            return true;
        }
    }
    scrollToAnchor() {
        if (this.location.anchor != null) {
            this.view.scrollToAnchor(this.location.anchor);
            return true;
        }
    }
    scrollToTop() {
        this.view.scrollToPosition({ x: 0, y: 0 });
    }
    recordTimingMetric(metric) {
        this.timingMetrics[metric] = new Date().getTime();
    }
    getTimingMetrics() {
        return Object.assign({}, this.timingMetrics);
    }
    getHistoryMethodForAction(action) {
        switch (action) {
            case "replace": return history.replaceState;
            case "advance":
            case "restore": return history.pushState;
        }
    }
    hasPreloadedResponse() {
        return typeof this.response == "object";
    }
    shouldIssueRequest() {
        return this.action == "restore"
            ? !this.hasCachedSnapshot()
            : true;
    }
    cacheSnapshot() {
        if (!this.snapshotCached) {
            this.view.cacheSnapshot();
            this.snapshotCached = true;
        }
    }
    render(callback) {
        this.cancelRender();
        this.frame = requestAnimationFrame(() => {
            delete this.frame;
            callback.call(this);
        });
    }
    cancelRender() {
        if (this.frame) {
            cancelAnimationFrame(this.frame);
            delete this.frame;
        }
    }
}
function isSuccessful(statusCode) {
    return statusCode >= 200 && statusCode < 300;
}

class BrowserAdapter {
    constructor(controller) {
        this.progressBar = new ProgressBar;
        this.showProgressBar = () => {
            this.progressBar.show();
        };
        this.controller = controller;
    }
    visitProposedToLocation(location, options) {
        const restorationIdentifier = uuid();
        this.controller.startVisitToLocation(location, restorationIdentifier, options);
    }
    visitStarted(visit) {
        visit.issueRequest();
        visit.changeHistory();
        visit.loadCachedSnapshot();
    }
    visitRequestStarted(visit) {
        this.progressBar.setValue(0);
        if (visit.hasCachedSnapshot() || visit.action != "restore") {
            this.showProgressBarAfterDelay();
        }
        else {
            this.showProgressBar();
        }
    }
    visitRequestCompleted(visit) {
        visit.loadResponse();
    }
    visitRequestFailedWithStatusCode(visit, statusCode) {
        switch (statusCode) {
            case SystemStatusCode.networkFailure:
            case SystemStatusCode.timeoutFailure:
            case SystemStatusCode.contentTypeMismatch:
                return this.reload();
            default:
                return visit.loadResponse();
        }
    }
    visitRequestFinished(visit) {
        this.progressBar.setValue(1);
        this.hideProgressBar();
    }
    visitCompleted(visit) {
        visit.followRedirect();
    }
    pageInvalidated() {
        this.reload();
    }
    visitFailed(visit) {
    }
    visitRendered(visit) {
    }
    showProgressBarAfterDelay() {
        this.progressBarTimeout = window.setTimeout(this.showProgressBar, this.controller.progressBarDelay);
    }
    hideProgressBar() {
        this.progressBar.hide();
        if (this.progressBarTimeout != null) {
            window.clearTimeout(this.progressBarTimeout);
            delete this.progressBarTimeout;
        }
    }
    reload() {
        window.location.reload();
    }
}

class FormSubmitObserver {
    constructor(delegate) {
        this.started = false;
        this.submitCaptured = () => {
            removeEventListener("submit", this.submitBubbled, false);
            addEventListener("submit", this.submitBubbled, false);
        };
        this.submitBubbled = (event) => {
            if (!event.defaultPrevented) {
                const form = event.target instanceof HTMLFormElement ? event.target : undefined;
                if (form) {
                    if (this.delegate.willSubmitForm(form)) {
                        event.preventDefault();
                        this.delegate.formSubmitted(form);
                    }
                }
            }
        };
        this.delegate = delegate;
    }
    start() {
        if (!this.started) {
            addEventListener("submit", this.submitCaptured, true);
            this.started = true;
        }
    }
    stop() {
        if (this.started) {
            removeEventListener("submit", this.submitCaptured, true);
            this.started = false;
        }
    }
}

class FormInterceptor {
    constructor(delegate, element) {
        this.submitBubbled = (event) => {
            if (event.target instanceof HTMLFormElement) {
                const form = event.target;
                if (this.delegate.shouldInterceptFormSubmission(form)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this.delegate.formSubmissionIntercepted(form);
                }
            }
        };
        this.delegate = delegate;
        this.element = element;
    }
    start() {
        this.element.addEventListener("submit", this.submitBubbled);
    }
    stop() {
        this.element.removeEventListener("submit", this.submitBubbled);
    }
}

var FormSubmissionState;
(function (FormSubmissionState) {
    FormSubmissionState[FormSubmissionState["initialized"] = 0] = "initialized";
    FormSubmissionState[FormSubmissionState["requesting"] = 1] = "requesting";
    FormSubmissionState[FormSubmissionState["waiting"] = 2] = "waiting";
    FormSubmissionState[FormSubmissionState["receiving"] = 3] = "receiving";
    FormSubmissionState[FormSubmissionState["stopping"] = 4] = "stopping";
    FormSubmissionState[FormSubmissionState["stopped"] = 5] = "stopped";
})(FormSubmissionState || (FormSubmissionState = {}));
class FormSubmission {
    constructor(delegate, formElement, mustRedirect = false) {
        this.state = FormSubmissionState.initialized;
        this.delegate = delegate;
        this.formElement = formElement;
        this.formData = new FormData(formElement);
        this.fetchRequest = new FetchRequest(this, this.method, this.location, this.formData);
        this.mustRedirect = mustRedirect;
    }
    get method() {
        const method = this.formElement.getAttribute("method") || "";
        return fetchMethodFromString(method.toLowerCase()) || FetchMethod.get;
    }
    get location() {
        return Location.wrap(this.formElement.action);
    }
    async start() {
        const { initialized, requesting } = FormSubmissionState;
        if (this.state == initialized) {
            this.state = requesting;
            return this.fetchRequest.perform();
        }
    }
    stop() {
        const { stopping, stopped } = FormSubmissionState;
        if (this.state != stopping && this.state != stopped) {
            this.state = stopping;
            this.fetchRequest.cancel();
            return true;
        }
    }
    additionalHeadersForRequest(request) {
        const headers = {};
        if (this.method != FetchMethod.get) {
            const token = getCookieValue(getMetaContent("csrf-param")) || getMetaContent("csrf-token");
            if (token) {
                headers["X-CSRF-Token"] = token;
            }
        }
        return headers;
    }
    requestStarted(request) {
        this.state = FormSubmissionState.waiting;
        dispatch("turbo:submit-start", { target: this.formElement, data: { formSubmission: this } });
        this.delegate.formSubmissionStarted(this);
    }
    requestPreventedHandlingResponse(request, response) {
        this.result = { success: response.succeeded, fetchResponse: response };
    }
    requestSucceededWithResponse(request, response) {
        if (this.requestMustRedirect(request) && !response.redirected) {
            const error = new Error("Form responses must redirect to another location");
            this.delegate.formSubmissionErrored(this, error);
        }
        else {
            this.state = FormSubmissionState.receiving;
            this.result = { success: true, fetchResponse: response };
            this.delegate.formSubmissionSucceededWithResponse(this, response);
        }
    }
    requestFailedWithResponse(request, response) {
        this.result = { success: false, fetchResponse: response };
        this.delegate.formSubmissionFailedWithResponse(this, response);
    }
    requestErrored(request, error) {
        this.result = { success: false, error };
        this.delegate.formSubmissionErrored(this, error);
    }
    requestFinished(request) {
        this.state = FormSubmissionState.stopped;
        dispatch("turbo:submit-end", { target: this.formElement, data: Object.assign({ formSubmission: this }, this.result) });
        this.delegate.formSubmissionFinished(this);
    }
    requestMustRedirect(request) {
        return !request.isIdempotent && this.mustRedirect;
    }
}
function getCookieValue(cookieName) {
    if (cookieName != null) {
        const cookies = document.cookie ? document.cookie.split("; ") : [];
        const cookie = cookies.find((cookie) => cookie.startsWith(cookieName));
        if (cookie) {
            const value = cookie.split("=").slice(1).join("=");
            return value ? decodeURIComponent(value) : undefined;
        }
    }
}
function getMetaContent(name) {
    const element = document.querySelector(`meta[name="${name}"]`);
    return element && element.content;
}

class LinkInterceptor {
    constructor(delegate, element) {
        this.clickBubbled = (event) => {
            if (this.respondsToEventTarget(event.target)) {
                this.clickEvent = event;
            }
            else {
                delete this.clickEvent;
            }
        };
        this.linkClicked = ((event) => {
            if (this.clickEvent && this.respondsToEventTarget(event.target)) {
                if (this.delegate.shouldInterceptLinkClick(event.target, event.data.url)) {
                    this.clickEvent.preventDefault();
                    event.preventDefault();
                    this.delegate.linkClickIntercepted(event.target, event.data.url);
                }
            }
            delete this.clickEvent;
        });
        this.willVisit = () => {
            delete this.clickEvent;
        };
        this.delegate = delegate;
        this.element = element;
    }
    start() {
        this.element.addEventListener("click", this.clickBubbled);
        document.addEventListener("turbo:click", this.linkClicked);
        document.addEventListener("turbo:before-visit", this.willVisit);
    }
    stop() {
        this.element.removeEventListener("click", this.clickBubbled);
        document.removeEventListener("turbo:click", this.linkClicked);
        document.removeEventListener("turbo:before-visit", this.willVisit);
    }
    respondsToEventTarget(target) {
        const element = target instanceof Element
            ? target
            : target instanceof Node
                ? target.parentElement
                : null;
        return element && element.closest("turbo-frame, html") == this.element;
    }
}

class FrameController {
    constructor(element) {
        this.resolveVisitPromise = () => { };
        this.element = element;
        this.linkInterceptor = new LinkInterceptor(this, this.element);
        this.formInterceptor = new FormInterceptor(this, this.element);
    }
    connect() {
        this.linkInterceptor.start();
        this.formInterceptor.start();
    }
    disconnect() {
        this.linkInterceptor.stop();
        this.formInterceptor.stop();
    }
    shouldInterceptLinkClick(element, url) {
        return this.shouldInterceptNavigation(element);
    }
    linkClickIntercepted(element, url) {
        const frame = this.findFrameElement(element);
        frame.src = url;
    }
    shouldInterceptFormSubmission(element) {
        return this.shouldInterceptNavigation(element);
    }
    formSubmissionIntercepted(element) {
        if (this.formSubmission) {
            this.formSubmission.stop();
        }
        this.formSubmission = new FormSubmission(this, element);
        this.formSubmission.start();
    }
    async visit(url) {
        const location = Location.wrap(url);
        const request = new FetchRequest(this, FetchMethod.get, location);
        return new Promise(resolve => {
            this.resolveVisitPromise = () => {
                this.resolveVisitPromise = () => { };
                resolve();
            };
            request.perform();
        });
    }
    additionalHeadersForRequest(request) {
        return { "X-Turbo-Frame": this.id };
    }
    requestStarted(request) {
        this.element.setAttribute("busy", "");
    }
    requestPreventedHandlingResponse(request, response) {
        this.resolveVisitPromise();
    }
    async requestSucceededWithResponse(request, response) {
        await this.loadResponse(response);
        this.resolveVisitPromise();
    }
    requestFailedWithResponse(request, response) {
        console.error(response);
        this.resolveVisitPromise();
    }
    requestErrored(request, error) {
        console.error(error);
        this.resolveVisitPromise();
    }
    requestFinished(request) {
        this.element.removeAttribute("busy");
    }
    formSubmissionStarted(formSubmission) {
    }
    formSubmissionSucceededWithResponse(formSubmission, response) {
        const frame = this.findFrameElement(formSubmission.formElement);
        frame.controller.loadResponse(response);
    }
    formSubmissionFailedWithResponse(formSubmission, fetchResponse) {
    }
    formSubmissionErrored(formSubmission, error) {
    }
    formSubmissionFinished(formSubmission) {
    }
    findFrameElement(element) {
        var _a;
        const id = element.getAttribute("data-turbo-frame");
        return (_a = getFrameElementById(id)) !== null && _a !== void 0 ? _a : this.element;
    }
    async loadResponse(response) {
        const fragment = fragmentFromHTML(await response.responseHTML);
        const element = await this.extractForeignFrameElement(fragment);
        if (element) {
            await nextAnimationFrame();
            this.loadFrameElement(element);
            this.scrollFrameIntoView(element);
            await nextAnimationFrame();
            this.focusFirstAutofocusableElement();
        }
    }
    async extractForeignFrameElement(container) {
        let element;
        const id = CSS.escape(this.id);
        if (element = activateElement(container.querySelector(`turbo-frame#${id}`))) {
            return element;
        }
        if (element = activateElement(container.querySelector(`turbo-frame[src][recurse~=${id}]`))) {
            await element.loaded;
            return await this.extractForeignFrameElement(element);
        }
    }
    loadFrameElement(frameElement) {
        var _a;
        const destinationRange = document.createRange();
        destinationRange.selectNodeContents(this.element);
        destinationRange.deleteContents();
        const sourceRange = (_a = frameElement.ownerDocument) === null || _a === void 0 ? void 0 : _a.createRange();
        if (sourceRange) {
            sourceRange.selectNodeContents(frameElement);
            this.element.appendChild(sourceRange.extractContents());
        }
    }
    focusFirstAutofocusableElement() {
        const element = this.firstAutofocusableElement;
        if (element) {
            element.focus();
            return true;
        }
        return false;
    }
    scrollFrameIntoView(frame) {
        if (this.element.autoscroll || frame.autoscroll) {
            const element = this.element.firstElementChild;
            const block = readScrollLogicalPosition(this.element.getAttribute("data-autoscroll-block"), "end");
            if (element) {
                element.scrollIntoView({ block });
                return true;
            }
        }
        return false;
    }
    shouldInterceptNavigation(element) {
        const id = element.getAttribute("data-turbo-frame") || this.element.getAttribute("links-target");
        if (!this.enabled || id == "top") {
            return false;
        }
        if (id) {
            const frameElement = getFrameElementById(id);
            if (frameElement) {
                return !frameElement.disabled;
            }
        }
        return true;
    }
    get firstAutofocusableElement() {
        const element = this.element.querySelector("[autofocus]");
        return element instanceof HTMLElement ? element : null;
    }
    get id() {
        return this.element.id;
    }
    get enabled() {
        return !this.element.disabled;
    }
}
function getFrameElementById(id) {
    if (id != null) {
        const element = document.getElementById(id);
        if (element instanceof FrameElement) {
            return element;
        }
    }
}
function readScrollLogicalPosition(value, defaultValue) {
    if (value == "end" || value == "start" || value == "center" || value == "nearest") {
        return value;
    }
    else {
        return defaultValue;
    }
}
function fragmentFromHTML(html = "") {
    const foreignDocument = document.implementation.createHTMLDocument();
    return foreignDocument.createRange().createContextualFragment(html);
}
function activateElement(element) {
    if (element && element.ownerDocument !== document) {
        element = document.importNode(element, true);
    }
    if (element instanceof FrameElement) {
        return element;
    }
}

class FrameElement extends HTMLElement {
    constructor() {
        super();
        this.controller = new FrameController(this);
    }
    static get observedAttributes() {
        return ["src"];
    }
    connectedCallback() {
        this.controller.connect();
    }
    disconnectedCallback() {
        this.controller.disconnect();
    }
    attributeChangedCallback() {
        if (this.src && this.isActive) {
            const value = this.controller.visit(this.src);
            Object.defineProperty(this, "loaded", { value, configurable: true });
        }
    }
    formSubmissionIntercepted(element) {
        this.controller.formSubmissionIntercepted(element);
    }
    get src() {
        return this.getAttribute("src");
    }
    set src(value) {
        if (value) {
            this.setAttribute("src", value);
        }
        else {
            this.removeAttribute("src");
        }
    }
    get loaded() {
        return Promise.resolve(undefined);
    }
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(value) {
        if (value) {
            this.setAttribute("disabled", "");
        }
        else {
            this.removeAttribute("disabled");
        }
    }
    get autoscroll() {
        return this.hasAttribute("autoscroll");
    }
    set autoscroll(value) {
        if (value) {
            this.setAttribute("autoscroll", "");
        }
        else {
            this.removeAttribute("autoscroll");
        }
    }
    get isActive() {
        return this.ownerDocument === document && !this.isPreview;
    }
    get isPreview() {
        var _a, _b;
        return (_b = (_a = this.ownerDocument) === null || _a === void 0 ? void 0 : _a.documentElement) === null || _b === void 0 ? void 0 : _b.hasAttribute("data-turbo-preview");
    }
}
customElements.define("turbo-frame", FrameElement);

class FrameRedirector {
    constructor(element) {
        this.element = element;
        this.linkInterceptor = new LinkInterceptor(this, element);
        this.formInterceptor = new FormInterceptor(this, element);
    }
    start() {
        this.linkInterceptor.start();
        this.formInterceptor.start();
    }
    stop() {
        this.linkInterceptor.stop();
        this.formInterceptor.stop();
    }
    shouldInterceptLinkClick(element, url) {
        return this.shouldRedirect(element);
    }
    linkClickIntercepted(element, url) {
        const frame = this.findFrameElement(element);
        if (frame) {
            frame.src = url;
        }
    }
    shouldInterceptFormSubmission(element) {
        return this.shouldRedirect(element);
    }
    formSubmissionIntercepted(element) {
        const frame = this.findFrameElement(element);
        if (frame) {
            frame.formSubmissionIntercepted(element);
        }
    }
    shouldRedirect(element) {
        const frame = this.findFrameElement(element);
        return frame ? frame != element.closest("turbo-frame") : false;
    }
    findFrameElement(element) {
        const id = element.getAttribute("data-turbo-frame");
        if (id && id != "top") {
            const frame = this.element.querySelector(`#${id}:not([disabled])`);
            if (frame instanceof FrameElement) {
                return frame;
            }
        }
    }
}

class History {
    constructor(delegate) {
        this.restorationData = {};
        this.started = false;
        this.pageLoaded = false;
        this.onPopState = (event) => {
            if (this.shouldHandlePopState()) {
                const { turbo } = event.state || {};
                if (turbo) {
                    const location = Location.currentLocation;
                    this.location = location;
                    const { restorationIdentifier } = turbo;
                    this.restorationIdentifier = restorationIdentifier;
                    this.delegate.historyPoppedToLocationWithRestorationIdentifier(location, restorationIdentifier);
                }
            }
        };
        this.onPageLoad = (event) => {
            defer(() => {
                this.pageLoaded = true;
            });
        };
        this.delegate = delegate;
    }
    start() {
        if (!this.started) {
            this.previousScrollRestoration = history.scrollRestoration;
            history.scrollRestoration = "manual";
            addEventListener("popstate", this.onPopState, false);
            addEventListener("load", this.onPageLoad, false);
            this.started = true;
            this.replace(Location.currentLocation);
        }
    }
    stop() {
        var _a;
        if (this.started) {
            history.scrollRestoration = (_a = this.previousScrollRestoration) !== null && _a !== void 0 ? _a : "auto";
            removeEventListener("popstate", this.onPopState, false);
            removeEventListener("load", this.onPageLoad, false);
            this.started = false;
        }
    }
    push(location, restorationIdentifier) {
        this.update(history.pushState, location, restorationIdentifier);
    }
    replace(location, restorationIdentifier) {
        this.update(history.replaceState, location, restorationIdentifier);
    }
    update(method, location, restorationIdentifier = uuid()) {
        const state = { turbo: { restorationIdentifier } };
        method.call(history, state, "", location.absoluteURL);
        this.location = location;
        this.restorationIdentifier = restorationIdentifier;
    }
    getRestorationDataForIdentifier(restorationIdentifier) {
        return this.restorationData[restorationIdentifier] || {};
    }
    updateRestorationData(additionalData) {
        const { restorationIdentifier } = this;
        const restorationData = this.restorationData[restorationIdentifier];
        this.restorationData[restorationIdentifier] = Object.assign(Object.assign({}, restorationData), additionalData);
    }
    shouldHandlePopState() {
        return this.pageIsLoaded();
    }
    pageIsLoaded() {
        return this.pageLoaded || document.readyState == "complete";
    }
}

class LinkClickObserver {
    constructor(delegate) {
        this.started = false;
        this.clickCaptured = () => {
            removeEventListener("click", this.clickBubbled, false);
            addEventListener("click", this.clickBubbled, false);
        };
        this.clickBubbled = (event) => {
            if (this.clickEventIsSignificant(event)) {
                const link = this.findLinkFromClickTarget(event.target);
                if (link) {
                    const location = this.getLocationForLink(link);
                    if (this.delegate.willFollowLinkToLocation(link, location)) {
                        event.preventDefault();
                        this.delegate.followedLinkToLocation(link, location);
                    }
                }
            }
        };
        this.delegate = delegate;
    }
    start() {
        if (!this.started) {
            addEventListener("click", this.clickCaptured, true);
            this.started = true;
        }
    }
    stop() {
        if (this.started) {
            removeEventListener("click", this.clickCaptured, true);
            this.started = false;
        }
    }
    clickEventIsSignificant(event) {
        return !((event.target && event.target.isContentEditable)
            || event.defaultPrevented
            || event.which > 1
            || event.altKey
            || event.ctrlKey
            || event.metaKey
            || event.shiftKey);
    }
    findLinkFromClickTarget(target) {
        if (target instanceof Element) {
            return closest(target, "a[href]:not([target^=_]):not([download])");
        }
    }
    getLocationForLink(link) {
        return new Location(link.getAttribute("href") || "");
    }
}

class Navigator {
    constructor(delegate) {
        this.delegate = delegate;
    }
    proposeVisit(location, options = {}) {
        if (this.delegate.allowsVisitingLocation(location)) {
            this.delegate.visitProposedToLocation(location, options);
        }
    }
    startVisit(location, restorationIdentifier, options = {}) {
        this.stop();
        this.currentVisit = new Visit(this, location, restorationIdentifier, Object.assign({ referrer: this.location }, options));
        this.currentVisit.start();
    }
    submitForm(form) {
        this.stop();
        this.formSubmission = new FormSubmission(this, form, true);
        this.formSubmission.start();
    }
    stop() {
        if (this.formSubmission) {
            this.formSubmission.stop();
            delete this.formSubmission;
        }
        if (this.currentVisit) {
            this.currentVisit.cancel();
            delete this.currentVisit;
        }
    }
    reload() {
    }
    goBack() {
    }
    get adapter() {
        return this.delegate.adapter;
    }
    get view() {
        return this.delegate.view;
    }
    get history() {
        return this.delegate.history;
    }
    formSubmissionStarted(formSubmission) {
    }
    async formSubmissionSucceededWithResponse(formSubmission, fetchResponse) {
        console.log("Form submission succeeded", formSubmission);
        if (formSubmission == this.formSubmission) {
            const responseHTML = await fetchResponse.responseHTML;
            if (responseHTML) {
                if (formSubmission.method != FetchMethod.get) {
                    console.log("Clearing snapshot cache after successful form submission");
                    this.view.clearSnapshotCache();
                }
                const { statusCode } = fetchResponse;
                const visitOptions = { response: { statusCode, responseHTML } };
                console.log("Visiting", fetchResponse.location, visitOptions);
                this.proposeVisit(fetchResponse.location, visitOptions);
            }
        }
    }
    formSubmissionFailedWithResponse(formSubmission, fetchResponse) {
        console.error("Form submission failed", formSubmission, fetchResponse);
    }
    formSubmissionErrored(formSubmission, error) {
        console.error("Form submission failed", formSubmission, error);
    }
    formSubmissionFinished(formSubmission) {
    }
    visitStarted(visit) {
        this.delegate.visitStarted(visit);
    }
    visitCompleted(visit) {
        this.delegate.visitCompleted(visit);
    }
    get location() {
        return this.history.location;
    }
}

var PageStage;
(function (PageStage) {
    PageStage[PageStage["initial"] = 0] = "initial";
    PageStage[PageStage["loading"] = 1] = "loading";
    PageStage[PageStage["interactive"] = 2] = "interactive";
    PageStage[PageStage["complete"] = 3] = "complete";
    PageStage[PageStage["invalidated"] = 4] = "invalidated";
})(PageStage || (PageStage = {}));
class PageObserver {
    constructor(delegate) {
        this.stage = PageStage.initial;
        this.started = false;
        this.interpretReadyState = () => {
            const { readyState } = this;
            if (readyState == "interactive") {
                this.pageIsInteractive();
            }
            else if (readyState == "complete") {
                this.pageIsComplete();
            }
        };
        this.delegate = delegate;
    }
    start() {
        if (!this.started) {
            if (this.stage == PageStage.initial) {
                this.stage = PageStage.loading;
            }
            document.addEventListener("readystatechange", this.interpretReadyState, false);
            this.started = true;
        }
    }
    stop() {
        if (this.started) {
            document.removeEventListener("readystatechange", this.interpretReadyState, false);
            this.started = false;
        }
    }
    invalidate() {
        if (this.stage != PageStage.invalidated) {
            this.stage = PageStage.invalidated;
            this.delegate.pageInvalidated();
        }
    }
    pageIsInteractive() {
        if (this.stage == PageStage.loading) {
            this.stage = PageStage.interactive;
            this.delegate.pageBecameInteractive();
        }
    }
    pageIsComplete() {
        this.pageIsInteractive();
        if (this.stage == PageStage.interactive) {
            this.stage = PageStage.complete;
            this.delegate.pageLoaded();
        }
    }
    get readyState() {
        return document.readyState;
    }
}

class ScrollObserver {
    constructor(delegate) {
        this.started = false;
        this.onScroll = () => {
            this.updatePosition({ x: window.pageXOffset, y: window.pageYOffset });
        };
        this.delegate = delegate;
    }
    start() {
        if (!this.started) {
            addEventListener("scroll", this.onScroll, false);
            this.onScroll();
            this.started = true;
        }
    }
    stop() {
        if (this.started) {
            removeEventListener("scroll", this.onScroll, false);
            this.started = false;
        }
    }
    updatePosition(position) {
        this.delegate.scrollPositionChanged(position);
    }
}

class StreamMessage {
    constructor(html) {
        this.templateElement = document.createElement("template");
        this.templateElement.innerHTML = html;
    }
    static wrap(message) {
        if (typeof message == "string") {
            return new this(message);
        }
        else {
            return message;
        }
    }
    get fragment() {
        const fragment = document.createDocumentFragment();
        for (const element of this.foreignElements) {
            fragment.appendChild(document.importNode(element, true));
        }
        return fragment;
    }
    get foreignElements() {
        return this.templateChildren.reduce((streamElements, child) => {
            if (child.tagName.toLowerCase() == "turbo-stream") {
                return [...streamElements, child];
            }
            else {
                return streamElements;
            }
        }, []);
    }
    get templateChildren() {
        return Array.from(this.templateElement.content.children);
    }
}
StreamMessage.contentType = "text/html; turbo-stream";

class StreamObserver {
    constructor(delegate) {
        this.sources = new Set;
        this.started = false;
        this.prepareFetchRequest = (event) => {
            var _a;
            const fetchOptions = (_a = event.data) === null || _a === void 0 ? void 0 : _a.fetchOptions;
            if (fetchOptions) {
                const { headers } = fetchOptions;
                headers.Accept = [StreamMessage.contentType, headers.Accept].join(", ");
            }
        };
        this.inspectFetchResponse = (event) => {
            const fetchResponse = fetchResponseFromEvent(event);
            if ((fetchResponse === null || fetchResponse === void 0 ? void 0 : fetchResponse.contentType) == StreamMessage.contentType) {
                event.preventDefault();
                this.receiveMessageResponse(fetchResponse);
            }
        };
        this.receiveMessageEvent = (event) => {
            if (this.started && typeof event.data == "string") {
                this.receiveMessageHTML(event.data);
            }
        };
        this.delegate = delegate;
    }
    start() {
        if (!this.started) {
            this.started = true;
            addEventListener("turbo:before-fetch-request", this.prepareFetchRequest, true);
            addEventListener("turbo:before-fetch-response", this.inspectFetchResponse, false);
        }
    }
    stop() {
        if (this.started) {
            this.started = false;
            removeEventListener("turbo:before-fetch-request", this.prepareFetchRequest, true);
            removeEventListener("turbo:before-fetch-response", this.inspectFetchResponse, false);
        }
    }
    connectStreamSource(source) {
        if (!this.streamSourceIsConnected(source)) {
            this.sources.add(source);
            source.addEventListener("message", this.receiveMessageEvent, false);
        }
    }
    disconnectStreamSource(source) {
        if (this.streamSourceIsConnected(source)) {
            this.sources.delete(source);
            source.removeEventListener("message", this.receiveMessageEvent, false);
        }
    }
    streamSourceIsConnected(source) {
        return this.sources.has(source);
    }
    async receiveMessageResponse(response) {
        const html = await response.responseHTML;
        if (html) {
            this.receiveMessageHTML(html);
        }
    }
    receiveMessageHTML(html) {
        this.delegate.receivedMessageFromStream(new StreamMessage(html));
    }
}
function fetchResponseFromEvent(event) {
    var _a;
    if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.fetchResponse) instanceof FetchResponse) {
        return event.data.fetchResponse;
    }
}

function isAction(action) {
    return action == "advance" || action == "replace" || action == "restore";
}

class Renderer {
    renderView(callback) {
        this.delegate.viewWillRender(this.newBody);
        callback();
        this.delegate.viewRendered(this.newBody);
    }
    invalidateView() {
        this.delegate.viewInvalidated();
    }
    createScriptElement(element) {
        if (element.getAttribute("data-turbo-eval") == "false") {
            return element;
        }
        else {
            const createdScriptElement = document.createElement("script");
            createdScriptElement.textContent = element.textContent;
            createdScriptElement.async = false;
            copyElementAttributes(createdScriptElement, element);
            return createdScriptElement;
        }
    }
}
function copyElementAttributes(destinationElement, sourceElement) {
    for (const { name, value } of array(sourceElement.attributes)) {
        destinationElement.setAttribute(name, value);
    }
}

class ErrorRenderer extends Renderer {
    constructor(delegate, html) {
        super();
        this.delegate = delegate;
        this.htmlElement = (() => {
            const htmlElement = document.createElement("html");
            htmlElement.innerHTML = html;
            return htmlElement;
        })();
        this.newHead = this.htmlElement.querySelector("head") || document.createElement("head");
        this.newBody = this.htmlElement.querySelector("body") || document.createElement("body");
    }
    static render(delegate, callback, html) {
        return new this(delegate, html).render(callback);
    }
    render(callback) {
        this.renderView(() => {
            this.replaceHeadAndBody();
            this.activateBodyScriptElements();
            callback();
        });
    }
    replaceHeadAndBody() {
        const { documentElement, head, body } = document;
        documentElement.replaceChild(this.newHead, head);
        documentElement.replaceChild(this.newBody, body);
    }
    activateBodyScriptElements() {
        for (const replaceableElement of this.getScriptElements()) {
            const parentNode = replaceableElement.parentNode;
            if (parentNode) {
                const element = this.createScriptElement(replaceableElement);
                parentNode.replaceChild(element, replaceableElement);
            }
        }
    }
    getScriptElements() {
        return array(document.documentElement.querySelectorAll("script"));
    }
}

class SnapshotCache {
    constructor(size) {
        this.keys = [];
        this.snapshots = {};
        this.size = size;
    }
    has(location) {
        return location.toCacheKey() in this.snapshots;
    }
    get(location) {
        if (this.has(location)) {
            const snapshot = this.read(location);
            this.touch(location);
            return snapshot;
        }
    }
    put(location, snapshot) {
        this.write(location, snapshot);
        this.touch(location);
        return snapshot;
    }
    clear() {
        this.snapshots = {};
    }
    read(location) {
        return this.snapshots[location.toCacheKey()];
    }
    write(location, snapshot) {
        this.snapshots[location.toCacheKey()] = snapshot;
    }
    touch(location) {
        const key = location.toCacheKey();
        const index = this.keys.indexOf(key);
        if (index > -1)
            this.keys.splice(index, 1);
        this.keys.unshift(key);
        this.trim();
    }
    trim() {
        for (const key of this.keys.splice(this.size)) {
            delete this.snapshots[key];
        }
    }
}

class SnapshotRenderer extends Renderer {
    constructor(delegate, currentSnapshot, newSnapshot, isPreview) {
        super();
        this.delegate = delegate;
        this.currentSnapshot = currentSnapshot;
        this.currentHeadDetails = currentSnapshot.headDetails;
        this.newSnapshot = newSnapshot;
        this.newHeadDetails = newSnapshot.headDetails;
        this.newBody = newSnapshot.bodyElement;
        this.isPreview = isPreview;
    }
    static render(delegate, callback, currentSnapshot, newSnapshot, isPreview) {
        return new this(delegate, currentSnapshot, newSnapshot, isPreview).render(callback);
    }
    render(callback) {
        if (this.shouldRender()) {
            this.mergeHead();
            this.renderView(() => {
                this.replaceBody();
                if (!this.isPreview) {
                    this.focusFirstAutofocusableElement();
                }
                callback();
            });
        }
        else {
            this.invalidateView();
        }
    }
    mergeHead() {
        this.copyNewHeadStylesheetElements();
        this.copyNewHeadScriptElements();
        this.removeCurrentHeadProvisionalElements();
        this.copyNewHeadProvisionalElements();
    }
    replaceBody() {
        const placeholders = this.relocateCurrentBodyPermanentElements();
        this.activateNewBody();
        this.assignNewBody();
        this.replacePlaceholderElementsWithClonedPermanentElements(placeholders);
    }
    shouldRender() {
        return this.newSnapshot.isVisitable() && this.trackedElementsAreIdentical();
    }
    trackedElementsAreIdentical() {
        return this.currentHeadDetails.getTrackedElementSignature() == this.newHeadDetails.getTrackedElementSignature();
    }
    copyNewHeadStylesheetElements() {
        for (const element of this.getNewHeadStylesheetElements()) {
            document.head.appendChild(element);
        }
    }
    copyNewHeadScriptElements() {
        for (const element of this.getNewHeadScriptElements()) {
            document.head.appendChild(this.createScriptElement(element));
        }
    }
    removeCurrentHeadProvisionalElements() {
        for (const element of this.getCurrentHeadProvisionalElements()) {
            document.head.removeChild(element);
        }
    }
    copyNewHeadProvisionalElements() {
        for (const element of this.getNewHeadProvisionalElements()) {
            document.head.appendChild(element);
        }
    }
    relocateCurrentBodyPermanentElements() {
        return this.getCurrentBodyPermanentElements().reduce((placeholders, permanentElement) => {
            const newElement = this.newSnapshot.getPermanentElementById(permanentElement.id);
            if (newElement) {
                const placeholder = createPlaceholderForPermanentElement(permanentElement);
                replaceElementWithElement(permanentElement, placeholder.element);
                replaceElementWithElement(newElement, permanentElement);
                return [...placeholders, placeholder];
            }
            else {
                return placeholders;
            }
        }, []);
    }
    replacePlaceholderElementsWithClonedPermanentElements(placeholders) {
        for (const { element, permanentElement } of placeholders) {
            const clonedElement = permanentElement.cloneNode(true);
            replaceElementWithElement(element, clonedElement);
        }
    }
    activateNewBody() {
        document.adoptNode(this.newBody);
        this.activateNewBodyScriptElements();
    }
    activateNewBodyScriptElements() {
        for (const inertScriptElement of this.getNewBodyScriptElements()) {
            const activatedScriptElement = this.createScriptElement(inertScriptElement);
            replaceElementWithElement(inertScriptElement, activatedScriptElement);
        }
    }
    assignNewBody() {
        if (document.body) {
            replaceElementWithElement(document.body, this.newBody);
        }
        else {
            document.documentElement.appendChild(this.newBody);
        }
    }
    focusFirstAutofocusableElement() {
        const element = this.newSnapshot.findFirstAutofocusableElement();
        if (elementIsFocusable(element)) {
            element.focus();
        }
    }
    getNewHeadStylesheetElements() {
        return this.newHeadDetails.getStylesheetElementsNotInDetails(this.currentHeadDetails);
    }
    getNewHeadScriptElements() {
        return this.newHeadDetails.getScriptElementsNotInDetails(this.currentHeadDetails);
    }
    getCurrentHeadProvisionalElements() {
        return this.currentHeadDetails.getProvisionalElements();
    }
    getNewHeadProvisionalElements() {
        return this.newHeadDetails.getProvisionalElements();
    }
    getCurrentBodyPermanentElements() {
        return this.currentSnapshot.getPermanentElementsPresentInSnapshot(this.newSnapshot);
    }
    getNewBodyScriptElements() {
        return array(this.newBody.querySelectorAll("script"));
    }
}
function createPlaceholderForPermanentElement(permanentElement) {
    const element = document.createElement("meta");
    element.setAttribute("name", "turbo-permanent-placeholder");
    element.setAttribute("content", permanentElement.id);
    return { element, permanentElement };
}
function replaceElementWithElement(fromElement, toElement) {
    const parentElement = fromElement.parentElement;
    if (parentElement) {
        return parentElement.replaceChild(toElement, fromElement);
    }
}
function elementIsFocusable(element) {
    return element && typeof element.focus == "function";
}

class View {
    constructor(delegate) {
        this.htmlElement = document.documentElement;
        this.snapshotCache = new SnapshotCache(10);
        this.delegate = delegate;
    }
    getRootLocation() {
        return this.getSnapshot().getRootLocation();
    }
    getElementForAnchor(anchor) {
        return this.getSnapshot().getElementForAnchor(anchor);
    }
    getSnapshot() {
        return Snapshot.fromHTMLElement(this.htmlElement);
    }
    clearSnapshotCache() {
        this.snapshotCache.clear();
    }
    shouldCacheSnapshot() {
        return this.getSnapshot().isCacheable();
    }
    cacheSnapshot() {
        if (this.shouldCacheSnapshot()) {
            this.delegate.viewWillCacheSnapshot();
            const snapshot = this.getSnapshot();
            const location = this.lastRenderedLocation || Location.currentLocation;
            defer(() => this.snapshotCache.put(location, snapshot.clone()));
        }
    }
    getCachedSnapshotForLocation(location) {
        return this.snapshotCache.get(location);
    }
    render({ snapshot, error, isPreview }, callback) {
        this.markAsPreview(isPreview);
        if (snapshot) {
            this.renderSnapshot(snapshot, isPreview, callback);
        }
        else {
            this.renderError(error, callback);
        }
    }
    scrollToAnchor(anchor) {
        const element = this.getElementForAnchor(anchor);
        if (element) {
            this.scrollToElement(element);
        }
        else {
            this.scrollToPosition({ x: 0, y: 0 });
        }
    }
    scrollToElement(element) {
        element.scrollIntoView();
    }
    scrollToPosition({ x, y }) {
        window.scrollTo(x, y);
    }
    markAsPreview(isPreview) {
        if (isPreview) {
            this.htmlElement.setAttribute("data-turbo-preview", "");
        }
        else {
            this.htmlElement.removeAttribute("data-turbo-preview");
        }
    }
    renderSnapshot(snapshot, isPreview, callback) {
        SnapshotRenderer.render(this.delegate, callback, this.getSnapshot(), snapshot, isPreview || false);
    }
    renderError(error, callback) {
        ErrorRenderer.render(this.delegate, callback, error || "");
    }
}

class Controller {
    constructor() {
        this.adapter = new BrowserAdapter(this);
        this.navigator = new Navigator(this);
        this.history = new History(this);
        this.view = new View(this);
        this.pageObserver = new PageObserver(this);
        this.linkClickObserver = new LinkClickObserver(this);
        this.formSubmitObserver = new FormSubmitObserver(this);
        this.scrollObserver = new ScrollObserver(this);
        this.streamObserver = new StreamObserver(this);
        this.frameRedirector = new FrameRedirector(document.documentElement);
        this.enabled = true;
        this.progressBarDelay = 500;
        this.started = false;
    }
    start() {
        if (!this.started) {
            this.pageObserver.start();
            this.linkClickObserver.start();
            this.formSubmitObserver.start();
            this.scrollObserver.start();
            this.streamObserver.start();
            this.frameRedirector.start();
            this.history.start();
            this.started = true;
            this.enabled = true;
        }
    }
    disable() {
        this.enabled = false;
    }
    stop() {
        if (this.started) {
            this.pageObserver.stop();
            this.linkClickObserver.stop();
            this.formSubmitObserver.stop();
            this.scrollObserver.stop();
            this.streamObserver.stop();
            this.frameRedirector.stop();
            this.history.stop();
            this.started = false;
        }
    }
    registerAdapter(adapter) {
        this.adapter = adapter;
    }
    visit(location, options = {}) {
        this.navigator.proposeVisit(Location.wrap(location), options);
    }
    startVisitToLocation(location, restorationIdentifier, options) {
        this.navigator.startVisit(Location.wrap(location), restorationIdentifier, options);
    }
    connectStreamSource(source) {
        this.streamObserver.connectStreamSource(source);
    }
    disconnectStreamSource(source) {
        this.streamObserver.disconnectStreamSource(source);
    }
    renderStreamMessage(message) {
        document.documentElement.appendChild(StreamMessage.wrap(message).fragment);
    }
    clearCache() {
        this.view.clearSnapshotCache();
    }
    setProgressBarDelay(delay) {
        this.progressBarDelay = delay;
    }
    get location() {
        return this.history.location;
    }
    get restorationIdentifier() {
        return this.history.restorationIdentifier;
    }
    historyPoppedToLocationWithRestorationIdentifier(location) {
        if (this.enabled) {
            this.navigator.proposeVisit(location, { action: "restore", historyChanged: true });
        }
        else {
            this.adapter.pageInvalidated();
        }
    }
    scrollPositionChanged(position) {
        this.history.updateRestorationData({ scrollPosition: position });
    }
    willFollowLinkToLocation(link, location) {
        return this.linkIsVisitable(link)
            && this.locationIsVisitable(location)
            && this.applicationAllowsFollowingLinkToLocation(link, location);
    }
    followedLinkToLocation(link, location) {
        const action = this.getActionForLink(link);
        this.visit(location, { action });
    }
    allowsVisitingLocation(location) {
        return this.applicationAllowsVisitingLocation(location);
    }
    visitProposedToLocation(location, options) {
        this.adapter.visitProposedToLocation(location, options);
    }
    visitStarted(visit) {
        this.notifyApplicationAfterVisitingLocation(visit.location);
    }
    visitCompleted(visit) {
        this.notifyApplicationAfterPageLoad(visit.getTimingMetrics());
    }
    willSubmitForm(form) {
        return true;
    }
    formSubmitted(form) {
        this.navigator.submitForm(form);
    }
    pageBecameInteractive() {
        this.view.lastRenderedLocation = this.location;
        this.notifyApplicationAfterPageLoad();
    }
    pageLoaded() {
    }
    pageInvalidated() {
        this.adapter.pageInvalidated();
    }
    receivedMessageFromStream(message) {
        this.renderStreamMessage(message);
    }
    viewWillRender(newBody) {
        this.notifyApplicationBeforeRender(newBody);
    }
    viewRendered() {
        this.view.lastRenderedLocation = this.history.location;
        this.notifyApplicationAfterRender();
    }
    viewInvalidated() {
        this.pageObserver.invalidate();
    }
    viewWillCacheSnapshot() {
        this.notifyApplicationBeforeCachingSnapshot();
    }
    applicationAllowsFollowingLinkToLocation(link, location) {
        const event = this.notifyApplicationAfterClickingLinkToLocation(link, location);
        return !event.defaultPrevented;
    }
    applicationAllowsVisitingLocation(location) {
        const event = this.notifyApplicationBeforeVisitingLocation(location);
        return !event.defaultPrevented;
    }
    notifyApplicationAfterClickingLinkToLocation(link, location) {
        return dispatch("turbo:click", { target: link, data: { url: location.absoluteURL }, cancelable: true });
    }
    notifyApplicationBeforeVisitingLocation(location) {
        return dispatch("turbo:before-visit", { data: { url: location.absoluteURL }, cancelable: true });
    }
    notifyApplicationAfterVisitingLocation(location) {
        return dispatch("turbo:visit", { data: { url: location.absoluteURL } });
    }
    notifyApplicationBeforeCachingSnapshot() {
        return dispatch("turbo:before-cache");
    }
    notifyApplicationBeforeRender(newBody) {
        return dispatch("turbo:before-render", { data: { newBody } });
    }
    notifyApplicationAfterRender() {
        return dispatch("turbo:render");
    }
    notifyApplicationAfterPageLoad(timing = {}) {
        return dispatch("turbo:load", { data: { url: this.location.absoluteURL, timing } });
    }
    getActionForLink(link) {
        const action = link.getAttribute("data-turbo-action");
        return isAction(action) ? action : "advance";
    }
    linkIsVisitable(link) {
        const container = closest(link, "[data-turbo]");
        if (container) {
            return container.getAttribute("data-turbo") != "false";
        }
        else {
            return true;
        }
    }
    locationIsVisitable(location) {
        return location.isPrefixedBy(this.view.getRootLocation()) && location.isHTML();
    }
}

const controller = new Controller;
const { navigator } = controller;
function start() {
    controller.start();
}
function registerAdapter(adapter) {
    controller.registerAdapter(adapter);
}
function visit(location, options) {
    controller.visit(location, options);
}
function connectStreamSource(source) {
    controller.connectStreamSource(source);
}
function disconnectStreamSource(source) {
    controller.disconnectStreamSource(source);
}
function renderStreamMessage(message) {
    controller.renderStreamMessage(message);
}
function clearCache() {
    controller.clearCache();
}
function setProgressBarDelay(delay) {
    controller.setProgressBarDelay(delay);
}

start();

export { clearCache, connectStreamSource, disconnectStreamSource, navigator, registerAdapter, renderStreamMessage, setProgressBarDelay, start, visit };
//# sourceMappingURL=turbo.es2017-esm.js.map
