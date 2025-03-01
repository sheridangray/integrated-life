/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./public/js/auth.js":
/*!***************************!*\
  !*** ./public/js/auth.js ***!
  \***************************/
/***/ (() => {

// Define the callback function first
window.handleCredentialResponse = function (response) {
  var _document$querySelect;
  // Detailed logging of the entire response
  console.log("=== Google Sign-In Response ===");
  //   console.log("Full response object:", response);
  //   console.log("Credential:", response.credential);

  // Decode the JWT token to see the user information
  if (response.credential) {
    var payload = JSON.parse(atob(response.credential.split(".")[1]));
    // console.log("Decoded JWT payload:", payload);
    console.log("User email:", payload.email);
    console.log("User name:", payload.name);
    console.log("User picture:", payload.picture);
  }

  // Display the email address from the response object
  if (response.ky && response.ky.ez) {
    console.log("User email from response object:", response.ky.ez);
  }
  if (!response || !response.credential) {
    console.error("Invalid Google response:", response);
    return;
  }

  // Get CSRF token from meta tag
  var csrfToken = (_document$querySelect = document.querySelector('meta[name="csrf-token"]')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.content;

  // Define requestBody after ensuring response.credential is valid
  var requestBody = {
    credential: response.credential,
    _csrf: csrfToken
  };
  console.log("Sending to server:", requestBody);
  fetch("/api/v1/users/google-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "CSRF-Token": csrfToken
    },
    credentials: "include",
    body: JSON.stringify(requestBody)
  }).then(function (res) {
    console.log("Server response status:", res.status);
    return res.json();
  }).then(function (data) {
    console.log("Server response data:", data);
    // Check for success status
    if (data.status === "success") {
      console.log("Login successful, redirecting to homepage...");
      window.location.href = "/";
    } else {
      console.error("Login failed:", data.message);
      var errorMessage = document.getElementById("error-message");
      if (errorMessage) {
        errorMessage.textContent = data.message || "Login failed. Please try again.";
      }
    }
  })["catch"](function (error) {
    console.error("Error during login:", error);
    var errorMessage = document.getElementById("error-message");
    if (errorMessage) {
      errorMessage.textContent = "An unexpected error occurred. Please try again later.";
    }
  });
};

/***/ }),

/***/ "./public/js/food/recipe-list.js":
/*!***************************************!*\
  !*** ./public/js/food/recipe-list.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
console.log("Loading recipe-list module");
function initRecipeList() {
  // console.log("Initializing recipe list");

  var recipeGrid = document.getElementById("recipe-list");
  var toggleFavoritesBtn = document.getElementById("toggle-favorites");
  var searchInput = document.querySelector(".search-bar__input input");
  var searchClearBtn = document.querySelector(".search-clear-btn");
  if (!recipeGrid) {
    console.log("Recipe grid not found");
    return;
  }

  // console.log("Found recipe grid:", recipeGrid);
  var showingFavorites = false;
  var searchQuery = "";

  // Function to check if a recipe matches the search query
  function recipeMatchesSearch(recipe) {
    if (!searchQuery) return true;
    var searchTerms = searchQuery.toLowerCase().split(" ");
    var recipeText = [recipe.querySelector(".recipe-card__title").textContent, recipe.querySelector(".recipe-card__description").textContent, recipe.querySelector(".recipe-meta").textContent].join(" ").toLowerCase();

    // Check if all search terms are found in the recipe text
    return searchTerms.every(function (term) {
      return recipeText.includes(term);
    });
  }

  // Function to update recipe visibility based on current filters
  function updateRecipeVisibility() {
    var recipes = recipeGrid.querySelectorAll(".recipe-card-wrapper");
    recipes.forEach(function (recipe) {
      var isFavorite = recipe.querySelector(".favorite-button").classList.contains("active");
      var matchesSearch = recipeMatchesSearch(recipe);
      var shouldShow = (!showingFavorites || isFavorite) && matchesSearch;
      recipe.style.display = shouldShow ? "flex" : "none";
    });
  }

  // Function to update search clear button visibility
  function updateSearchClearButton() {
    if (searchClearBtn) {
      searchClearBtn.classList.toggle("hidden", !searchQuery);
    }
  }

  // Function to clear search
  function clearSearch() {
    if (searchInput) {
      searchInput.value = "";
      searchQuery = "";
      updateSearchClearButton();
      updateRecipeVisibility();
    }
  }

  // Handle search input
  if (searchInput) {
    // Debounce function to limit how often the search is performed
    var debounce = function debounce(func, wait) {
      var timeout;
      return function executedFunction() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        var later = function later() {
          clearTimeout(timeout);
          func.apply(void 0, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }; // Handle search input with debouncing
    searchInput.addEventListener("input", debounce(function (e) {
      searchQuery = e.target.value.trim();
      updateSearchClearButton();
      updateRecipeVisibility();
    }, 300));

    // Handle clear button click
    if (searchClearBtn) {
      searchClearBtn.addEventListener("click", clearSearch);
    }

    // Handle escape key to clear search
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        clearSearch();
      }
    });
  }

  // Handle individual recipe favorite toggling
  recipeGrid.addEventListener("click", /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(e) {
      var favoriteBtn, recipeCard, recipeId, csrfToken, response, data, icon;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            favoriteBtn = e.target.closest(".favorite-button");
            if (favoriteBtn) {
              _context.next = 3;
              break;
            }
            return _context.abrupt("return");
          case 3:
            console.log("Favorite button clicked");
            e.preventDefault();
            e.stopPropagation();
            recipeCard = favoriteBtn.closest(".recipe-card-wrapper");
            recipeId = recipeCard.dataset.recipeId;
            console.log("Recipe ID:", recipeId);
            _context.prev = 9;
            // Get CSRF token from meta tag
            csrfToken = document.querySelector('meta[name="csrf-token"]').content;
            console.log("CSRF Token:", csrfToken);
            console.log("Sending favorite toggle request...");
            _context.next = 15;
            return fetch("/food/recipes/".concat(recipeId, "/favorite"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken,
                "X-CSRF-Token": csrfToken
              },
              credentials: "same-origin"
            });
          case 15:
            response = _context.sent;
            console.log("Response status:", response.status);
            if (response.ok) {
              _context.next = 19;
              break;
            }
            throw new Error("Failed to toggle favorite");
          case 19:
            _context.next = 21;
            return response.json();
          case 21:
            data = _context.sent;
            console.log("Response data:", data);

            // Update UI
            favoriteBtn.classList.toggle("active");
            icon = favoriteBtn.querySelector(".material-icons");
            icon.textContent = data.isFavorite ? "favorite" : "favorite_border";

            // Update visibility based on current filters
            updateRecipeVisibility();
            _context.next = 32;
            break;
          case 29:
            _context.prev = 29;
            _context.t0 = _context["catch"](9);
            console.error("Error toggling favorite:", _context.t0);
          case 32:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[9, 29]]);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());

  // Handle favorites filter toggle
  if (toggleFavoritesBtn) {
    toggleFavoritesBtn.addEventListener("click", function () {
      console.log("Toggle favorites filter clicked");
      showingFavorites = !showingFavorites;
      toggleFavoritesBtn.classList.toggle("active");
      updateRecipeVisibility();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRecipeList);
} else {
  initRecipeList();
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (initRecipeList);

/***/ }),

/***/ "./public/js/food/recipe-new.js":
/*!**************************************!*\
  !*** ./public/js/food/recipe-new.js ***!
  \**************************************/
/***/ (() => {

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("recipeForm");
  if (!form) {
    console.warn("Recipe form not found");
    return;
  }
  var submitButton = document.getElementById("submitButton");
  var defaultIcon = submitButton.querySelector(".icon-default");
  var loadingIcon = submitButton.querySelector(".icon-loading");
  var buttonText = submitButton.querySelector(".button-text");

  // Add debug logging
  console.log("Elements found:", {
    submitButton: submitButton,
    defaultIcon: defaultIcon,
    loadingIcon: loadingIcon,
    buttonText: buttonText
  });
  var setLoading = function setLoading(isLoading) {
    console.log("Setting loading state:", isLoading);
    submitButton.disabled = isLoading;
    defaultIcon.classList.toggle("hidden", isLoading);
    loadingIcon.classList.toggle("hidden", !isLoading);
    buttonText.textContent = isLoading ? "Creating Recipe..." : "Create Recipe";
  };
  form.addEventListener("submit", /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(e) {
      var token, formData, response, data;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            e.preventDefault();
            console.log("Submit button clicked");
            // Prevent double submission
            if (!submitButton.disabled) {
              _context.next = 4;
              break;
            }
            return _context.abrupt("return");
          case 4:
            setLoading(true);
            token = document.querySelector('input[name="_csrf"]').value;
            formData = new FormData(this);
            _context.prev = 7;
            _context.next = 10;
            return fetch("/food/recipes", {
              method: "POST",
              body: formData,
              headers: {
                "CSRF-Token": token,
                "X-CSRF-Token": token
              },
              credentials: "same-origin"
            });
          case 10:
            response = _context.sent;
            if (response.ok) {
              _context.next = 21;
              break;
            }
            _context.next = 14;
            return response.json();
          case 14:
            data = _context.sent;
            console.error("Submission error:", data);
            if (!(response.status === 403)) {
              _context.next = 20;
              break;
            }
            alert("Session expired. Page will reload.");
            window.location.reload();
            return _context.abrupt("return");
          case 20:
            throw new Error(data.message || "Submission failed");
          case 21:
            // Successful submission
            window.location.href = "/food/recipes";
            _context.next = 29;
            break;
          case 24:
            _context.prev = 24;
            _context.t0 = _context["catch"](7);
            console.error("Form submission error:", _context.t0);
            alert("Error submitting form. Please try again.");
            setLoading(false);
          case 29:
          case "end":
            return _context.stop();
        }
      }, _callee, this, [[7, 24]]);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
});

/***/ }),

/***/ "./public/js/header.js":
/*!*****************************!*\
  !*** ./public/js/header.js ***!
  \*****************************/
/***/ (() => {

document.addEventListener("DOMContentLoaded", function () {
  var userMenuButton = document.getElementById("userMenuButton");
  if (userMenuButton) {
    userMenuButton.addEventListener("click", function () {
      var dropdown = document.getElementById("userDropdown");
      if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
        console.log("Menu closed");
      } else {
        dropdown.style.display = "block";
        console.log("Menu opened");
      }
    });

    // Close the dropdown if the user clicks outside of it
    window.onclick = function (event) {
      if (!event.target.matches("#userMenuButton")) {
        var dropdowns = document.getElementsByClassName("dropdown-menu");
        for (var i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.style.display === "block") {
            openDropdown.style.display = "none";
            console.log("Menu closed");
          }
        }
      }
    };
  }
});

/***/ }),

/***/ "./public/js/time/time.js":
/*!********************************!*\
  !*** ./public/js/time/time.js ***!
  \********************************/
/***/ (() => {

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
document.addEventListener("DOMContentLoaded", function () {
  var birthDate = new Date("1984-12-23");
  var today = new Date();

  // Calculate age in weeks
  var ageInMilliseconds = today - birthDate;
  var ageInWeeks = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24 * 7));

  // Calculate current year and week
  var currentYear = Math.floor(ageInWeeks / 52);
  var currentWeek = ageInWeeks % 52;
  var phases = {
    early: {
      start: 0,
      end: 5
    },
    elementary: {
      start: 5,
      end: 11
    },
    middle: {
      start: 11,
      end: 14
    },
    high: {
      start: 14,
      end: 18
    },
    college: {
      start: 18,
      end: 22
    },
    youngAdult: {
      start: 22,
      end: 30
    },
    adult: {
      start: 30,
      end: 50
    },
    aging: {
      start: 50,
      end: 75
    },
    immobile: {
      start: 75,
      end: 90
    }
  };
  function updateGrid() {
    // console.log("Updating grid with phases:", JSON.stringify(phases, null, 2));
    var weekCells = document.querySelectorAll(".life-grid__week");
    // console.log(`Found ${weekCells.length} week cells`);

    weekCells.forEach(function (cell, index) {
      var cellYear = Math.floor(index / 52);
      var cellWeek = index % 52;

      // Reset classes
      cell.className = "life-grid__week";

      // Add past/current/future states
      if (cellYear < currentYear || cellYear === currentYear && cellWeek <= currentWeek) {
        cell.classList.add("life-grid__week--past");
      }
      if (cellYear === currentYear && cellWeek === currentWeek) {
        cell.classList.add("life-grid__week--current");
      }

      // Add life phase
      Object.entries(phases).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          phase = _ref2[0],
          ages = _ref2[1];
        if (cellYear >= ages.start && cellYear < ages.end) {
          cell.classList.add("life-grid__week--".concat(phase));
        }
      });
    });
  }

  // Handle input changes
  document.querySelectorAll(".phase-input").forEach(function (input) {
    input.addEventListener("change", function () {
      console.log("Input changed:", {
        phase: this.dataset.phase,
        type: this.dataset.type,
        value: this.value,
        element: this
      });
      var phase = this.dataset.phase;
      var type = this.dataset.type;
      var value = parseInt(this.value);

      // Validate input
      if (isNaN(value) || value < 0 || value > 90) {
        console.warn("Invalid input value:", value);
        return;
      }

      // Update phases object
      var oldValue = phases[phase][type];
      phases[phase][type] = value;
      console.log("Updated ".concat(phase, ".").concat(type, " from ").concat(oldValue, " to ").concat(value));

      // Validate phase ranges
      if (phases[phase].start >= phases[phase].end) {
        console.warn("Invalid phase range:", phases[phase]);
        // Reset to previous value if invalid
        this.value = type === "start" ? phases[phase].end - 1 : phases[phase].start + 1;
        phases[phase][type] = parseInt(this.value);
        console.log("Corrected to:", phases[phase]);
      }

      // Check for overlaps with adjacent phases
      var phaseNames = Object.keys(phases);
      var currentIndex = phaseNames.indexOf(phase);
      if (type === "start" && currentIndex > 0) {
        var previousPhase = phaseNames[currentIndex - 1];
        if (value < phases[previousPhase].end) {
          console.warn("Overlap with previous phase:", previousPhase);
          this.value = phases[previousPhase].end;
          phases[phase].start = phases[previousPhase].end;
        }
      }
      if (type === "end" && currentIndex < phaseNames.length - 1) {
        var nextPhase = phaseNames[currentIndex + 1];
        if (value > phases[nextPhase].start) {
          console.warn("Overlap with next phase:", nextPhase);
          this.value = phases[nextPhase].start;
          phases[phase].end = phases[nextPhase].start;
        }
      }
      console.log("Final phases state:", JSON.stringify(phases, null, 2));
      updateGrid();
    });

    // Also listen for immediate input changes
    input.addEventListener("input", function () {
      console.log("Input typing:", {
        phase: this.dataset.phase,
        type: this.dataset.type,
        value: this.value,
        element: this
      });
      var phase = this.dataset.phase;
      var type = this.dataset.type;
      var value = parseInt(this.value);
      if (!isNaN(value) && value >= 0 && value <= 90) {
        phases[phase][type] = value;
        updateGrid();
      }
    });
  });

  // Log initial state
  // console.log("Initial phases:", JSON.stringify(phases, null, 2));
  // console.log("Current year:", currentYear, "Current week:", currentWeek);

  // Initial grid update
  updateGrid();
});

/***/ }),

/***/ "./public/js/upload.js":
/*!*****************************!*\
  !*** ./public/js/upload.js ***!
  \*****************************/
/***/ (() => {

document.addEventListener("DOMContentLoaded", function () {
  var fileUpload = document.querySelector(".file-upload");
  if (!fileUpload) {
    return;
  }
  var fileInput = document.querySelector(".file-upload__input");
  var fileLabel = document.querySelector(".file-upload__label span");
  var defaultText = fileLabel ? fileLabel.textContent : "Choose a photo or drag it here";
  if (!fileUpload || !fileInput || !fileLabel) {
    console.warn("File upload elements not found.");
    return;
  }

  // Update filename when file is selected
  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      var fileName = fileInput.files[0].name;
      fileLabel.textContent = fileName;
    } else {
      fileLabel.textContent = defaultText;
    }
  });

  // Drag and drop functionality
  fileUpload.addEventListener("dragover", function (e) {
    e.preventDefault();
    fileUpload.classList.add("dragover");
  });
  fileUpload.addEventListener("dragleave", function () {
    fileUpload.classList.remove("dragover");
  });
  fileUpload.addEventListener("drop", function (e) {
    e.preventDefault();
    fileUpload.classList.remove("dragover");
    var files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      fileLabel.textContent = files[0].name;
    }
  });
});

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!***************************!*\
  !*** ./public/js/main.js ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _header__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./header */ "./public/js/header.js");
/* harmony import */ var _header__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_header__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./auth */ "./public/js/auth.js");
/* harmony import */ var _auth__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_auth__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _upload__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./upload */ "./public/js/upload.js");
/* harmony import */ var _upload__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_upload__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _food_recipe_new__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./food/recipe-new */ "./public/js/food/recipe-new.js");
/* harmony import */ var _food_recipe_new__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_food_recipe_new__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _food_recipe_list__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./food/recipe-list */ "./public/js/food/recipe-list.js");
/* harmony import */ var _time_time__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./time/time */ "./public/js/time/time.js");
/* harmony import */ var _time_time__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_time_time__WEBPACK_IMPORTED_MODULE_5__);
// Import all your JavaScript modules here






// Any other global JavaScript initialization can go here
console.log("Main.js loaded");
})();

/******/ })()
;
//# sourceMappingURL=bundle.1fa8639dd2fb3bfd29f0.js.map