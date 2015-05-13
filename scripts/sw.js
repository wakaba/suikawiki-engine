(function () {
  var samiURL = '/scripts/sami-core';
  var swSamiURL = '/scripts/sw-sami';
  
  var script = document.createElement ('script');
  script.src = samiURL;
  script.defer = true;
  script.async = true;
  document.body.appendChild (script);

  if (!self.SAMI) self.SAMI = {};
  SAMI.onLoadFunctions = SAMI.onLoadFunctions || [];
  SAMI.onLoadFunctions.push (function () {
    SAMI.Script.loadScripts (new SAMI.List([swSamiURL]), function () {
      SW.init ();
    });
  });
}) ();

addEventListener ('DOMContentLoaded', function () {
  document.write = function (html) {
    var div = document.createElement ('div');
    div.innerHTML = html;
    var scripts = div.getElementsByTagName ('script');
    var scriptsL = scripts.length;
    for (var i = 0; i < scriptsL; i++) {
      var oldScript = scripts[i];
      var script = document.createElement ('script');
      if (oldScript.src) script.src = oldScript.src;
      if (oldScript.charset) script.charset = oldScript.charset;
      if (oldScript.text) script.text = oldScript.text;
      div.appendChild (script);
    }
    document.body.appendChild (div);
  };

  initEditForm (document.body);
  initFigures (document.body);
  initHeadings (document.body);
  initTOC (document.body);
  addGoogleSearch ();
  enableHTML5Support ();
  addGoogleAnalytics ();
}); // DOMContentLoaded

function getAncestorElement (n, t) {
  while (n != null) {
    if (n.nodeName == t) {
      return n;
    } else {
      n = n.parentNode;
    }
  }
  return null;
} // getAncestorElement

function getGlobalDateAndTimeString (date) {
  var r = '';
  r = date.getUTCFullYear (); // JS does not support years 0001-0999
  r += '-' + ('0' + (date.getUTCMonth () + 1)).slice (-2);
  r += '-' + ('0' + date.getUTCDate ()).slice (-2);
  r += 'T' + ('0' + date.getUTCHours ()).slice (-2);
  r += ':' + ('0' + date.getUTCMinutes ()).slice (-2);
  r += ':' + ('0' + date.getUTCSeconds ()).slice (-2);
  r += '.' + (date.getUTCMilliseconds () + '00').slice (2);
  r += 'Z';
  return r;
} // getGlobalDateAndTimeString

function getNextAnchorNumber (s) {
  var found = [];
  s.replace (/\[([0-9]+)\]/g, function (l, n) {
    found[parseInt (n)] = true;
  });
  var i = 1;
  while (true) {
    if (!found[i]) return i;
    i++;
  }
} // getNextAnchorNumber

function initEditForm (root) {
  createToolbar (root);

  Array.prototype.forEach.apply (root.querySelectorAll ('form .body-area'), [function (ba) {
    ba.addEventListener ('focus', function () {
      ba.scrollIntoView ();
    }, true);
    var ta = ba.querySelector ('textarea');
    ta.addEventListener ('keydown', function (ev) {
      if (ev.keyIdentifier === 'PageDown') {
        if (ta.scrollHeight <= ta.scrollTop + ta.offsetHeight) {
          ev.preventDefault ();
        }
      } else if (ev.keyIdentifier === 'PageUp') {
        if (this.scrollTop === 0) {
          ev.preventDefault ();
        }
      }
    });

    setTimeout (function () {
      ba.scrollIntoView ();
      var fragment = decodeURIComponent (location.hash.replace (/^#/, ''));
      if (/^section-/.test (fragment))  {
        var sections = fragment.replace (/^section-/, '').split (/\u2028/).filter (function (n) { return n.length > 0 });
        var data = ta.value.split (/\u000D?\u000A/);
        var j = 0;
        var i = 0;
        var matchedLine = null;
        while (i < data.length && j < sections.length) {
          if (/^\*+\s*/.test (data[i])) {
            var line = data[i].replace (/^\*+\s*/, '').replace (/\s+$/, '').replace (/\s+/g, '-');
            if (line === sections[j]) {
              matchedLine = i;
              j++;
              if (j === sections.length) break;
            }
          }
          i++;
        }
        if (matchedLine) {
          var value = data.slice (0, matchedLine).join ("\n");
          scrollByString (ta, value);
          ta.setSelectionRange (value.length, value.length);
        }
      } else if (/^anchor-[0-9]+$/.test (fragment)) {
        var text = '[' + fragment.replace (/^anchor-/, '') + ']';
        var n = ta.value.indexOf (text);
        if (n >= 0) {
          scrollByString (ta, ta.value.substring (0, n));
          ta.setSelectionRange (n, n);
        }
      }
    }, 0);

    ta.form.addEventListener ('submit', function () {
      var lastAnchor;
      ta.value.substring (0, ta.selectionStart).replace (/\[([0-9]+)\]/g, function (_, s) {
        lastAnchor = s;
      })
      if (lastAnchor) {
        ta.form.action = ta.form.action.replace (/#.*$/, '') + '#anchor-' + lastAnchor;
      }
    });
  }]);
} // initEditForm

function scrollByString (ta, value) {
  var dummy = document.createElement ('div');
  dummy.textContent = value;
  var cs = getComputedStyle (ta, null);
  "font width whiteSpace".split (/ /).forEach
      (function (n) { dummy.style[n] = cs[n] });
  document.body.appendChild (dummy);
  ta.scrollTop = dummy.offsetHeight;
  document.body.removeChild (dummy);
} // scrollByString

function createToolbar (root) {
  var containers = root.getElementsByClassName ('text-toolbar');
  for (var i = 0; i < containers.length; i++) {
    var container = containers[i];

    var form = getAncestorElement (container, 'FORM');
    var ta = form.elements.text;
    var insertText = function (added) {
      var st = ta.scrollTop;
      var ss = ta.selectionStart;
      var se = (ss != ta.selectionEnd);
      ta.value = ta.value.substring (0, ta.selectionStart)
          + added + ta.value.substring (ta.selectionEnd);
      if (se) {
        ta.setSelectionRange (ss, ss + added.length);
      } else {
        ta.setSelectionRange (ss + added.length, ss + added.length);
      }
      ta.scrollTop = st;
      ta.focus ();
    }; // insertText
    
    var addButton = function (labelHTML, title, onclick) {
      var button = document.createElement ('button');
      button.setAttribute ('type', 'button');
      button.innerHTML = labelHTML;
      button.title = title;
      button.onclick = onclick;
      container.appendChild (button);
    }; // addButton

    addButton ('[#]', 'Insert a new anchor number', function () {
      var added = '[' + getNextAnchorNumber (ta.value) + '] ';
      insertText (added);
    });

    addButton ('Now', 'Insert a timestamp', function () {
      var added = '[TIME[' + getGlobalDateAndTimeString (new Date) + ']]';
      insertText (added);
    });
  }
} // createToolbar

function enableHTML5Support () {
  window.TEROnLoad = function () {
    new TER.Delta (document.body);
  }; // window.TEROnLoad

  var timeScript = document.createElement ('script');
  timeScript.defer = true;
  timeScript.charset = 'utf-8';
  timeScript.src = '/scripts/time';
  document.documentElement.lastChild.appendChild (timeScript);
} // enableHTML5Support

function addGoogleSearch () {
  var placeholder = document.getElementById ('cse-search-form');
  if (!placeholder) return;

  var script = document.createElement ('script');
  script.src = '//www.google.co.jp/jsapi';
  script.onload = function () {
    google.load('search', '1');
    setTimeout (function () {
    //google.setOnLoadCallback(function() {
      var customSearchControl = new google.search.CustomSearchControl('partner-pub-6943204637055835:1339232282');
      customSearchControl.setResultSetSize(google.search.Search.FILTERED_CSE_RESULTSET);
      var options = new google.search.DrawOptions();
      options.setAutoComplete(true);
      customSearchControl.draw('cse-search-form', options);
    //}, true);
    }, 1000);
  }; // onload
  document.body.appendChild (script);
} // addGoogleSearch

function addGoogleAnalytics () {
  (function () {
    var _gaq = _gaq || [];
    _gaq.push (['_setAccount', 'UA-39820773-1']);
    _gaq.push (['_trackPageview']);
    window._gaq = _gaq;
    var ga = document.createElement ('script');
    ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    document.body.appendChild (ga);
  }) ();

  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-39820773-5', 'suikawiki.org');
  ga('send', 'pageview');
} // addGoogleAnalytics

/* Hack for IE */
document.createElement ('time');

function initHeadings (root) {
  var editLink = document.querySelector ('.nav.tools a[rel=edit]');
  Array.prototype.forEach.apply (root.querySelectorAll ('h1, h2, h3, h4, h5, h6'), [function (h) {
    var section = h.parentNode;
    if (!section || section.localName != 'section') return;
    if (!section.id) return;

    var a = document.createElement ('a');
    a.href = '#' + encodeURIComponent (section.id);
    a.className = 'sw-heading-anchor';
    a.textContent = '#';
    a.title = 'この章のパーマリンク';
    h.appendChild (a);

    var a = document.createElement ('a');
    a.href = editLink.href;
    a.hash = '#' + encodeURIComponent (section.id);
    a.className = 'sw-heading-link';
    a.textContent = '\u270E';
    a.title = 'この章の編集';
    h.appendChild (a);
  }]);

  Array.prototype.forEach.apply (document.querySelectorAll ('.sw-anchor-end'), [function (a) {
    a.onclick = function () {
      history.pushState ('', '', this.href);
      return false;
    };
    a.ondblclick = function () {
      location.href = editLink.href + '#' + this.id;
      return false;
    };
  }]);
} // initHeadings

function initTOC (root) {
  var article = root.querySelector ('.article');
  if (!article) return;

  var levelOffset = 0;
  var firstH = article.querySelector
    ('section > h1, section > h2, section > h3, section > h4, section > h5, section > h6');
  if (firstH) {
    levelOffset = parseInt (firstH.localName.replace (/^h/, '')) - 1;
  }

  var section = document.createElement ('section');
  section.id = 'toc';
  section.className = 'toc';
  var h = document.createElement ('h1');
  h.textContent = '目次';
  section.appendChild (h);
  var ol = document.createElement ('ol');
  ol.setAttribute ('data-level', 1);
  section.appendChild (ol);

  Array.prototype.forEach.apply (article.querySelectorAll ('.section > * > .sw-heading-anchor[href]'), [function (a) {
    var h = a.parentNode;
    var hLevel = parseInt (h.localName.replace (/^h/, '')) - levelOffset;
    var li = document.createElement ('li');
    var link = document.createElement ('a');
    link.href = a.href;
    link.innerHTML = h.innerHTML;
    Array.prototype.forEach.apply (link.querySelectorAll ('.sw-heading-anchor, .sw-heading-link, .sw-anchor-end'), [function (e) {
      e.parentNode.removeChild (e);
    }]);
    Array.prototype.forEach.apply (link.querySelectorAll ('a'), [function (e) {
      var df = document.createDocumentFragment ();
      Array.prototype.forEach.apply (e.childNodes, [function (n) { df.appendChild (n) }]);
      e.parentNode.replaceChild (df, e);
    }]);
    li.appendChild (link);
    while (true) {
      var olLevel = parseInt (ol.getAttribute ('data-level'));
      if (hLevel < olLevel) {
        ol = ol.parentNode.parentNode;
        continue;
      } else if (hLevel > olLevel) {
        if (!ol.lastElementChild) {
          ol.appendChild (document.createElement ('li'));
        }
        ol = ol.lastElementChild.appendChild (document.createElement ('ol'));
        ol.setAttribute ('data-level', olLevel + 1);
        continue;
      } else {
        break;
      }
    }
    ol.appendChild (li);
  }]);
    
  var after = article.querySelector ('section');
  if (!after) return;
  after.parentNode.insertBefore (section, after);
} // initTOC

if (!window.SW) window.SW = {};
if (!SW.Figure) SW.Figure = {};

SW.Figure.States = function (figure) {
/*
  This function derived from springyui.js
  <https://github.com/dhotson/springy/blob/master/springyui.js>.

Copyright (c) 2010 Dennis Hotson

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

*/

  var ul = figure.getElementsByTagName ('ul')[0];
  if (!ul) return;
  var list = ul.children;

  var svg = document.createElementNS ('http://www.w3.org/2000/svg', 'svg');
  svg.innerHTML = '<defs><marker id="triangle" viewBox="0 0 10 10" refX="11" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>';
  var svgDef = svg.firstChild;
  ul.parentNode.replaceChild (svg, ul);

  var graph = new Springy.Graph();
  var nodesByName = {};
  for (var i = 0; i < list.length; i++) {
    var item1 = list[i].firstElementChild;
    if (!item1) next;
    var item2 = item1.nextElementSibling;
    if (!nodesByName[item1.textContent]) {
      nodesByName[item1.textContent] = graph.newNode ({element: item1});
    }
    if (item2) {
      if (!nodesByName[item2.textContent]) {
        nodesByName[item2.textContent] = graph.newNode ({element: item2});
      }
      graph.newEdge (nodesByName[item1.textContent],
                     nodesByName[item2.textContent]);
    }
  }

  var layout = new Springy.Layout.ForceDirected (graph, 400, 400, 0.5);
  var currentBB = layout.getBoundingBox ();
  var targetBB = {bottomleft: new Springy.Vector (-2, -2),
                  topright: new Springy.Vector (2, 2)};
  Springy.requestAnimationFrame (function adjust () {
    targetBB = layout.getBoundingBox ();
    currentBB = {
      bottomleft: currentBB.bottomleft.add
                    (targetBB.bottomleft.subtract
                       (currentBB.bottomleft).divide (10)),
      topright: currentBB.topright.add
                    (targetBB.topright.subtract
                       (currentBB.topright).divide (10))
    };
    Springy.requestAnimationFrame (adjust);
  });
  var toScreen = function (p) {
    var size = currentBB.topright.subtract (currentBB.bottomleft);
    var sx = svg.offsetWidth * 0.05 + p.subtract (currentBB.bottomleft).divide (size.x).x * svg.offsetWidth * 0.9;
    var sy = svg.offsetHeight * 0.05 + p.subtract (currentBB.bottomleft).divide (size.y).y * svg.offsetHeight * 0.9;
    return new Springy.Vector (sx, sy);
  };
  var fromScreen = function (s) {
    var size = currentBB.topright.subtract (currentBB.bottomleft);
    var px = ((s.x - svg.offsetWidth * 0.05) / (svg.offsetWidth * 0.9)) * size.x + currentBB.bottomleft.x;
    var py = ((s.y - svg.offsetHeight * 0.05) / (svg.offsetHeight * 0.9)) * size.y + currentBB.bottomleft.y;
    return new Springy.Vector (px, py);
  };

  var textWidth = 10 * 16;
  var textHeight = 1 * 16;
  var lineHeight = 2.0;
  var renderer = new Springy.Renderer (
    layout,
    function clear () {
      svg.textContent = '';
      svg.appendChild (svgDef);
    },
    function drawEdge (edge, p1, p2) {
      var line = document.createElementNS (svg.namespaceURI, 'line');
      line.setAttribute ('class', 'edge');
      var s1 = toScreen (p1);
      var s2 = toScreen (p2);
      if (Math.abs (s2.y - s1.y) < textHeight * 4 &&
          ! (Math.abs (s2.x - s1.x) < textWidth * 1.0)) {
        if (s1.x < s2.x) {
          line.setAttribute ('x1', s1.x + textWidth / 2);
          line.setAttribute ('x2', s2.x - textWidth / 2);
        } else {
          line.setAttribute ('x1', s1.x - textWidth / 2);
          line.setAttribute ('x2', s2.x + textWidth / 2);
        }
        line.setAttribute ('y1', s1.y);
        line.setAttribute ('y2', s2.y);
      } else {
        line.setAttribute ('x1', s1.x);
        line.setAttribute ('x2', s2.x);
        if (s1.y < s2.y) {
          line.setAttribute ('y1', s1.y + textHeight * lineHeight / 2);
          line.setAttribute ('y2', s2.y - textHeight * lineHeight / 2);
        } else {
          line.setAttribute ('y1', s1.y - textHeight * lineHeight / 2);
          line.setAttribute ('y2', s2.y + textHeight * lineHeight / 2);
        }
      }
      svg.appendChild (line);
    },
    function drawNode (node, p) {
      var s = toScreen (p);
      var g = node.data.gElement || document.createElementNS (svg.namespaceURI, 'g');
      node.data.gElement = g;
      g.setAttribute ('class', 'node');
      var circle = g.querySelector ('rect') || document.createElementNS (svg.namespaceURI, 'rect');
      circle.setAttribute ('x', s.x - textWidth / 2);
      circle.setAttribute ('y', s.y - textHeight * lineHeight / 2);
      circle.setAttribute ('width', textWidth);
      circle.setAttribute ('height', textHeight * lineHeight);
      circle.setAttribute ('rx', 5);
      circle.setAttribute ('ry', 5);
      g.appendChild (circle);
      var text = g.querySelector ('foreignObject') || document.createElementNS (svg.namespaceURI, 'foreignObject');
      text.appendChild (node.data.element);
      text.setAttribute ('x', s.x - textWidth / 2);
      text.setAttribute ('y', s.y - textHeight / 2);
      text.setAttribute ('width', textWidth);
      text.setAttribute ('height', textHeight * 10);
      g.appendChild (text);
      svg.appendChild (g);
    }
  );

  var dragged = null;
  svg.onmousedown = function (ev) {
    var p = fromScreen ({x: ev.clientX - svg.offsetLeft, y: ev.clientY - svg.offsetTop});
    dragged = layout.nearest(p);
  };
  svg.onmousemove = function (ev) {
    var p = fromScreen ({x: ev.clientX - svg.offsetLeft, y: ev.clientY - svg.offsetTop});
    if (dragged !== null && dragged.node !== null) {
      dragged.point.p.x = p.x;
      dragged.point.p.y = p.y;
    }
    renderer.start();
  };
  window.addEventListener ('mouseup', function () { dragged = null });

  renderer.start();
}; // SW.Figure.States

SW.Figure.Railroad = function (figure) {
  var list = figure.querySelector ('ol, ul');
  if (!list) return;
  var svg = new SW.Figure.Railroad.Diagram (SW.Figure.Railroad.parseItems (list.children)).toSVG ();
  list.parentNode.replaceChild (svg, list);
}; // SW.Figure.Railroad

SW.Figure.Railroad.parseItems = function parseItems (list) {
  var items = Array.prototype.map.apply (list, [function (t) { return t }]);
  var elements = [];
  for (var i = 0; i < items.length; i++) {
    var li = items[i];
    if (li.lastChild.nodeType == li.TEXT_NODE &&
        li.lastChild.data.match (/^\s*$/)) {
      li.removeChild (li.lastChild);
    }
    if (li.childNodes.length == 2 &&
        li.firstChild.nodeType == li.TEXT_NODE &&
        li.lastChild.nodeType == li.ELEMENT_NODE &&
        li.lastChild.localName.match (/^[uo]l$/)) {
      var type = li.firstChild.data.replace (/\s+/g, '');
      if (type == '|') {
        var e = parseItems (li.lastChild.children);
        elements.push (new SW.Figure.Railroad.Choice (0, e));
        continue;
      } else if (type == '*' || type == '+') {
        var e = parseItems (li.lastChild.children);
        var f = {'*': SW.Figure.Railroad.ZeroOrMore, '+': SW.Figure.Railroad.OneOrMore}[type];
        elements.push (new f (new SW.Figure.Railroad.Sequence (e)));
        continue;
      } else if (type == '?') {
        var e = parseItems (li.lastChild.children);
        elements.push (new SW.Figure.Railroad.Optional (new SW.Figure.Railroad.Sequence (e)));
        continue;
      } else if (type == '=') {
        var e = parseItems (li.lastChild.children);
        elements.push (new SW.Figure.Railroad.Sequence (e));
        continue;
      } else {
        var e = parseItems (li.lastChild.children);
        e.unshift (new SW.Figure.Railroad.Comment (li.firstChild.data));
        elements.push (new SW.Figure.Railroad.Sequence (e));
        continue;
      }
    }
    var span = document.createElement ('span');
    span.innerHTML = li.innerHTML;
    document.body.appendChild (span); // for dimension
    elements.push (SW.Figure.Railroad.Terminal (span));
  }
  return elements;
}; // parseItems

(function () {
  if (!self.SW) self.SW = {};
  if (!SW.Figure) SW.Figure = {};
  if (!SW.Figure.Sequence) SW.Figure.Sequence = {};

  SW.Figure.Sequence.parseItems = function (container) {
    var diagram = new SW.Figure.Sequence.DataSet;
    var actors = {};
    var addActor = function (name, element) {
      actors[name] = new SW.Figure.Sequence.Actor
          ({label: element || document.createElement ('span')});
      diagram.add (actors[name]);
    };
    Array.prototype.forEach.apply (container.querySelectorAll ('dl'), [function (dl) {
      var lastDT;
      Array.prototype.forEach.apply (dl.children, [function (el) {
        if (el.localName === 'dt') {
          lastDT = el.textContent.replace (/\s+/g, ' ')
              .replace (/^ /, '').replace (/ $/, '');
        } else if (el.localName === 'dd') {
          if (lastDT) {
            var m;
            if (m = lastDT.match (/^(.+?) -> (.+)$/)) {
              if (!actors[m[1]]) addActor (m[1]);
              if (!actors[m[2]]) addActor (m[2]);
              diagram.add (new SW.Figure.Sequence.Signal
                               (actors[m[1]], actors[m[2]], {label: el}));
            } else if (m = lastDT.match (/^(.+?) ## (.+)$/)) {
              if (!actors[m[1]]) addActor (m[1]);
              if (!actors[m[2]]) addActor (m[2]);
              diagram.add (new SW.Figure.Sequence.Note
                               ([actors[m[1]], actors[m[2]]], {label: el}));
            } else if (m = lastDT.match (/^(.+) ?##$/)) {
              if (!actors[m[1]]) addActor (m[1]);
              diagram.add (new SW.Figure.Sequence.Note
                               (actors[m[1]], {label: el, placement: 'right'}));
            } else if (m = lastDT.match (/^## ?(.+)$/)) {
              if (!actors[m[1]]) addActor (m[1]);
              diagram.add (new SW.Figure.Sequence.Note
                               (actors[m[1]], {label: el, placement: 'left'}));
            } else if (m = lastDT.match (/^# ?(.+) ?#$/)) {
              if (!actors[m[1]]) addActor (m[1]);
              diagram.add (new SW.Figure.Sequence.Note
                               (actors[m[1]], {label: el, placement: 'over'}));
            } else {
              addActor (lastDT, el);
            }
            lastDT = null;
          }
        }
      }]);
    }]);
    SW.Figure.Sequence.draw (diagram, container);
  }; // parseItems

  SW.Figure.Sequence.DataSet = function () {
    this.actors = [];
    this.signals = [];
  }; // DataSet

  SW.Figure.Sequence.DataSet.prototype.add = function (obj) {
    if (obj instanceof SW.Figure.Sequence.Actor) {
      this.actors.push (obj);
      obj.index = this.actors.length - 1;
    } else if (obj instanceof SW.Figure.Sequence.Signal ||
               obj instanceof SW.Figure.Sequence.Note) {
      this.signals.push (obj);
    } else {
      throw new TypeError ("Unknown object");
    }
  }; // add

  SW.Figure.Sequence.Actor = function (opts) {
    this.label = {element: opts.label,
                  width: opts.label.offsetWidth,
                  height: opts.label.offsetHeight};
    this.index = null;
  }; // Actor

  SW.Figure.Sequence.Signal = function (actorA, actorB, opts) {
    opts = opts || {};
    this.type = "Signal";
    this.actorA = actorA;
    this.actorB = actorB;
    this.label = {element: opts.label,
                  width: opts.label.offsetWidth,
                  height: opts.label.offsetHeight};
  }; // Signal

  SW.Figure.Sequence.Signal.prototype.isSelf = function () {
    return this.actorA.index == this.actorB.index;
  }; // isSelf

  SW.Figure.Sequence.Note = function (actor, opts) {
    opts = opts || {};
    this.type = "Note";
    this.placement = opts.placement || 'over'; // over|right|left
    this.label = {element: opts.label,
                  width: opts.label.offsetWidth,
                  height: opts.label.offsetHeight};

    this.actor = actor;
    if (this.hasManyActors () && actor[0] == actor[1]) {
      throw new TypeError ("Note should be over two different actors");
    }
  }; // Note

  SW.Figure.Sequence.Note.prototype.hasManyActors = function () {
    return this.actor instanceof Array;
  }; // hasManyActors
}) ();
(function () {
  /*
    Derived from js sequence diagrams
    <http://bramp.github.io/js-sequence-diagrams/> by Andrew Brampton
    as of August 2013
    <https://github.com/bramp/js-sequence-diagrams/commit/4c64e16f366367939aa667ab396c02ed1dfef806>,
    distributed under the simplified BSD license
    <https://github.com/bramp/js-sequence-diagrams/blob/master/LICENCE>.
  */

  /** js sequence diagrams
   *  http://bramp.github.io/js-sequence-diagrams/
   *  (c) 2012-2013 Andrew Brampton (bramp.net)
   *  Simplified BSD license.
   */
	"use strict";

	// Following the CSS convention
	// Margin is the gap outside the box
	// Padding is the gap inside the box
	// Each object has x/y/width/height properties
	// The x/y should be top left corner
	// width/height is with both margin and padding

	// TODO
	// Image width is wrong, when there is a note in the right hand col
	// Title box could look better
	// Note box could look better

	var DIAGRAM_MARGIN = 10;

	var ACTOR_MARGIN   = 10; // Margin around a actor
	var ACTOR_PADDING  = 10; // Padding inside a actor

	var SIGNAL_MARGIN  = 5; // Margin around a signal
	var SIGNAL_PADDING = 5; // Padding inside a signal

	var NOTE_MARGIN   = 10; // Margin around a note
	var NOTE_PADDING  = 5; // Padding inside a note
	var NOTE_OVERLAP  = 15; // Overlap when using a "note over A,B"

	var TITLE_MARGIN   = 0;
	var TITLE_PADDING  = 5;

	var SELF_SIGNAL_WIDTH = 20; // How far out a self signal goes

        var SVG = 'http://www.w3.org/2000/svg';

	function getCenterX(box) {
		return box.x + box.width / 2;
	}

    var Drawer = function (diagram) {
      this.diagram = diagram;
      this._actors_height  = 0;
      this._signals_height = 0;
    };

    Drawer.prototype = {
      _initPaper: function (container) {
        this._paper = document.createElementNS (SVG, 'svg');
        this._paper.setAttribute ('width', 300);
        this._paper.setAttribute ('height', 200);

        var idPrefix = Math.random ();
        this._paperIDPrefix = idPrefix;
        var tempEl = document.createElementNS (SVG, 'div');
        tempEl.innerHTML = '<svg><defs><path stroke-linecap="round" d="M5,0 0,2.5 5,5z" id="IDPREFIX-marker-block"></path><marker id="IDPREFIX-marker-endblock" markerHeight="5" markerWidth="5" orient="auto" refX="5" refY="2.5"><use xlink:href="#IDPREFIX-marker-block" transform="rotate(180 2.5 2.5) scale(1,1)" stroke-width="1.0000" fill="#000" stroke="none"></use></marker></defs></svg>'.replace (/IDPREFIX/g, idPrefix);
        this._paper.appendChild (tempEl.firstChild.firstChild);

        container.appendChild (this._paper);
      }, // _initPaper

      _drawLine: function (p1, p2, className) {
        var svg = this._paper;
        var line = svg.ownerDocument.createElementNS (SVG, 'line');
        line.setAttribute ('class', className);
        line.setAttribute ('x1', p1[0]);
        line.setAttribute ('y1', p1[1]);
        line.setAttribute ('x2', p2[0]);
        line.setAttribute ('y2', p2[1]);
        svg.appendChild (line);
        return line;
      }, // _drawLine

      _drawRect: function (p, w, h, r, className) {
        var svg = this._paper;
        var rect = svg.ownerDocument.createElementNS (SVG, 'rect');
        rect.setAttribute ('class', className);
        rect.setAttribute ('x', p[0]);
        rect.setAttribute ('y', p[1]);
        rect.setAttribute ('rx', r || 0);
        rect.setAttribute ('ry', r || 0);
        rect.setAttribute ('width', w);
        rect.setAttribute ('height', h);
        svg.appendChild (rect);
        return rect;
      }, // _drawRect

      _drawText: function (p, className, text) {
        var svg = this._paper;
        var t = svg.ownerDocument.createElementNS (SVG, 'foreignObject');
        t.setAttribute ('class', className + ' text');
        t.setAttribute ('x', p[0] - text.width / 2);
        t.setAttribute ('y', p[1] - text.height / 2);
        t.setAttribute ('width', text.width);
        t.setAttribute ('height', text.height);
        Array.prototype.forEach.apply (text.element.childNodes, [function (node) {
          t.appendChild (node.cloneNode (true));
        }]);
        // XXX provide hook for scripts
        svg.appendChild (t);
      }, // _drawText

		draw : function(container) {
		    var diagram = this.diagram;
		    this._initPaper (container);

			this.layout();

                        this._paper.setAttribute ('width', diagram.width);
                        this._paper.setAttribute ('height', diagram.height);

			var y = DIAGRAM_MARGIN;
			this.draw_actors(y);
			this.draw_signals(y + this._actors_height);
		},

		layout : function() {
			// Local copies
			var diagram = this.diagram;
			var paper   = this._paper;
			var actors  = diagram.actors;
			var signals = diagram.signals;

			diagram.width = 0;  // min width
			diagram.height = 0; // min width

		        actors.forEach (function(a) {
			  a.x = 0; a.y = 0;
			  a.width = a.label.width + (ACTOR_PADDING + ACTOR_MARGIN) * 2;
			  a.height = a.label.height + (ACTOR_PADDING + ACTOR_MARGIN) * 2;

			  a.distances = [];
			  a.padding_right = 0;
			  this._actors_height = Math.max
                              (a.height, this._actors_height);
			}, this);

			function actor_ensure_distance(a, b, d) {
				if (a < 0) {
					// Ensure b has left margin
					b = actors[b];
					b.x = Math.max(d - b.width / 2, b.x);
				} else if (b >= actors.length) {
					// Ensure a has right margin
					a = actors[a];
					a.padding_right = Math.max(d, a.padding_right);
				} else {
					a = actors[a];
					a.distances[b] = Math.max(d, a.distances[b] ? a.distances[b] : 0);
				}
			}

		        signals.forEach (function(s) {
			  var a, b; // Indexes of the left and right actors involved

                          s.width = s.label.width;
                          s.height = s.label.height;

				var extra_width = 0;

				if (s.type == "Signal") {

					s.width  += (SIGNAL_MARGIN + SIGNAL_PADDING) * 2;
					s.height += (SIGNAL_MARGIN + SIGNAL_PADDING) * 2;

					if (s.isSelf()) {
						a = s.actorA.index;
						b = a + 1;
						s.width += SELF_SIGNAL_WIDTH;
					} else {
						a = Math.min(s.actorA.index, s.actorB.index);
						b = Math.max(s.actorA.index, s.actorB.index);
					}

				} else if (s.type == "Note") {
					s.width  += (NOTE_MARGIN + NOTE_PADDING) * 2;
					s.height += (NOTE_MARGIN + NOTE_PADDING) * 2;

					// HACK lets include the actor's padding
					extra_width = 2 * ACTOR_MARGIN;

					if (s.placement === "left") {
						b = s.actor.index;
						a = b - 1;
					} else if (s.placement === "right") {
						a = s.actor.index;
						b = a + 1;
					} else if (s.placement === "over" && s.hasManyActors()) {
						// Over multiple actors
						a = Math.min(s.actor[0].index, s.actor[1].index);
						b = Math.max(s.actor[0].index, s.actor[1].index);

						// We don't need our padding, and we want to overlap
						extra_width = - (NOTE_PADDING * 2 + NOTE_OVERLAP * 2);

					} else if (s.placement === "over") {
						// Over single actor
						a = s.actor.index;
						actor_ensure_distance(a - 1, a, s.width / 2);
						actor_ensure_distance(a, a + 1, s.width / 2);
						this._signals_height += s.height;

						return; // Bail out early
					}
				} else {
					throw new Error("Unhandled signal type:" + s.type);
				}

				actor_ensure_distance(a, b, s.width + extra_width);
				this._signals_height += s.height;
			}, this);

			// Re-jig the positions
			var actors_x = 0;
			actors.forEach (function(a) {
				a.x = Math.max(actors_x, a.x);

				// TODO This only works if we loop in sequence, 0, 1, 2, etc
				a.distances.forEach(function(distance, b) {
					// lodash (and possibly others) do not like sparse arrays
					// so sometimes they return undefined
					if (typeof distance == "undefined")
						return;

					b = actors[b];
					distance = Math.max(distance, a.width / 2, b.width / 2);
					b.x = Math.max(b.x, a.x + a.width/2 + distance - b.width/2);
				});

				actors_x = a.x + a.width + a.padding_right;
			}, this);

			diagram.width = Math.max(actors_x, diagram.width);

			// TODO Refactor a little
			diagram.width  += 2 * DIAGRAM_MARGIN;
			diagram.height += 2 * DIAGRAM_MARGIN + 2 * this._actors_height + this._signals_height;

			return this;
		},

		draw_actors : function(offsetY) {
			var y = offsetY;
		        this.diagram.actors.forEach (function(a) {
				// Top box
				this.draw_actor(a, y, this._actors_height);

				// Bottom box
				this.draw_actor(a, y + this._actors_height + this._signals_height, this._actors_height);

			    // Veritical line
			    var aX = getCenterX(a);
			    var line = this._drawLine
		                ([aX, y + this._actors_height - ACTOR_MARGIN],
		                 [aX, y + this._actors_height + ACTOR_MARGIN + this._signals_height],
                                 'actor-timeline');
			}, this);
		},

	    draw_actor: function (actor, offsetY, height) {
              actor.y = offsetY;
	      actor.height = height;
	      this._drawRect
                  ([actor.x + ACTOR_MARGIN, actor.y + ACTOR_MARGIN],
                   actor.width - ACTOR_MARGIN * 2,
                   actor.height - ACTOR_MARGIN * 2,
                   0,
                   'actor-label textbox');
              this._drawText
                  ([actor.x + ACTOR_MARGIN + ACTOR_PADDING + actor.label.width / 2,
                    actor.y + ACTOR_MARGIN + ACTOR_PADDING + actor.label.height / 2],
                   'actor-label', actor.label);
	    }, // draw_actor

		draw_signals : function (offsetY) {
			var y = offsetY;
		        this.diagram.signals.forEach (function(s) {
				if (s.type == "Signal") {
					if (s.isSelf()) {
						this.draw_self_signal(s, y);
					} else {
						this.draw_signal(s, y);
					}

				} else if (s.type == "Note") {
					this.draw_note(s, y);
				}

				y += s.height;
			}, this);
		},

	    draw_self_signal: function (signal, offsetY) {
              var aX = getCenterX (signal.actorA);
              var x = aX + SELF_SIGNAL_WIDTH + SIGNAL_PADDING + signal.label.width / 2;
	      var y = offsetY + signal.height / 2;

	      this._drawText
                  ([x, y], 'signal-label self-signal', signal.label);

   	      var attr = {};

	      var y1 = offsetY + SIGNAL_MARGIN;
	      var y2 = y1 + signal.height - SIGNAL_MARGIN;

	      // Draw three lines, the last one with a arrow
	      var line;
	      line = this._drawLine
                  ([aX, y1], [aX + SELF_SIGNAL_WIDTH, y1],
                   'signal-arrow-line self-signal');
	      this._setAttrs (line, attr);

	      line = this._drawLine
                  ([aX + SELF_SIGNAL_WIDTH, y1], [aX + SELF_SIGNAL_WIDTH, y2],
                   'signal-arrow-line self-signal');
	      this._setAttrs (line, attr);

              line = this._drawLine
                  ([aX + SELF_SIGNAL_WIDTH, y2], [aX, y2],
                   'signal-arrow self-signal');
	      this._setAttrs (line, attr);
	      this._setAttrs (line, {'marker-end': 'url(#' + this._paperIDPrefix + '-marker-endblock)'});
	    }, // draw_self_signal

	    draw_signal: function (signal, offsetY) {
	      var aX = getCenterX (signal.actorA);
	      var bX = getCenterX (signal.actorB);

	      // Mid point between actors
	      var x = (bX - aX) / 2 + aX;
	      var y = offsetY + SIGNAL_MARGIN + 2*SIGNAL_PADDING;

	      this._drawText ([x, y], 'signal-label', signal.label);

	      // Draw the line along the bottom of the signal
              y = offsetY + signal.height - SIGNAL_MARGIN - SIGNAL_PADDING;
	      var line = this._drawLine
                  ([aX, y], [bX, y], 'signal-arrow');
	      this._setAttrs
                  (line, {'marker-end': 'url(#' + this._paperIDPrefix + '-marker-endblock)'});
	    }, // draw_signal

	    draw_note: function (note, offsetY) {
	      note.y = offsetY;
	      var actorA = note.hasManyActors () ? note.actor[0] : note.actor;
	      var aX = getCenterX (actorA);
	      switch (note.placement) {
	      case "right":
		note.x = aX + ACTOR_MARGIN;
		break;
	      case "left":
		note.x = aX - ACTOR_MARGIN - note.width;
		break;
	      case "over":
		if (note.hasManyActors ()) {
		  var bX = getCenterX (note.actor[1]);
		  var overlap = NOTE_OVERLAP + NOTE_PADDING;
		  note.x = aX - overlap;
		  note.width = (bX + overlap) - note.x;
		} else {
		  note.x = aX - note.width / 2;
		}
		break;
	      default:
		throw new Error ("Unhandled note placement:" + note.placement);
	      }

	      this._drawRect
                  ([note.x + NOTE_MARGIN, note.y + NOTE_MARGIN],
                   note.width - NOTE_MARGIN * 2,
                   note.height - NOTE_MARGIN * 2,
                   5,
                   'note-label textbox');
              this._drawText
                  ([note.x + NOTE_MARGIN + NOTE_PADDING + note.label.width / 2,
                    note.y + NOTE_MARGIN + NOTE_PADDING + note.label.height / 2],
                   'note-label', note.label);
	    }, // draw_note

            _setAttrs: function (el, obj) {
              for (var n in obj) {
                el.setAttribute (n, obj[n]);
              }
            }, // _setAttrs
  }; // Drawer

  SW.Figure.Sequence.draw = function (diagram, container) {
    container.innerHTML = '';
    var drawer = new Drawer (diagram);
    drawer.draw (container);
  }; // draw
}());

(function () {
  SW.Figure.Packet = {};

  SW.Figure.Packet.parse = function (fig) {
    var ol = fig.querySelector ('ol');
    if (!ol) return;

    var options = {};
    var dl = fig.querySelector ('dl');
    if (dl) {
      var name = '';
      Array.prototype.forEach.apply (dl.children, [function (node) {
        if (node.localName === 'dt') {
          name = node.textContent.replace (/\s+/g, ' ').replace (/^ /, '').replace (/ $/, '');
        } else if (node.localName === 'dd') {
          options[name] = node.textContent.replace (/\s+/g, ' ').replace (/^ /, '').replace (/ $/, '');
        }
      }]);
    }
    options.width = parseInt (options.width || 16);

    var table = document.createElement ('table');
    var thead = document.createElement ('thead');
    var tr = document.createElement ('tr');
    for (var i = 0; i < options.width; i++) {
      var th = document.createElement ('th');
      th.textContent = i;
      tr.appendChild (th);
    }
    thead.appendChild (tr);
    table.appendChild (thead);

    var tbody = document.createElement ('tbody');
    table.appendChild (tbody);

    var items = [];

    Array.prototype.forEach.apply (ol.children, [function (li) {
      if (li.localName !== 'li') return;
      if (li.firstChild && li.firstChild.nodeType === li.TEXT_NODE) {
        var item = {container: li};
        li.firstChild.textContent = li.firstChild.textContent.replace (/^([0-9]+)(\.\.\.)?\s*/, function (_, n, more) {
          item.length = parseInt (n);
          item.more = !!more;
          return '';
        });
        if (item.length == null) return;

        items.push (item);
      }
    }]);

    var tr = document.createElement ('tr');
    var start = 0;
    var end = 0;
    var current = 0;
    items.forEach (function (item) {
      tbody.appendChild (tr);
      var mainTD;
      var itemWidth = item.length;

      end += itemWidth;
      var title = item.more ? start + '...' : start + (start + 1 != end ? '..' + (end-1) : '') + ' (length = ' + item.length + ')';

      var lastTD;
      if (options.width - current < itemWidth) {
        mainTD = document.createElement ('td');
        mainTD.className = 'packet-field continue-end';
        mainTD.colSpan = options.width - current;
        itemWidth -= (options.width - current);
        tr.appendChild (mainTD);

        while (options.width < itemWidth) {
          tr = document.createElement ('tr');
          var td = lastTD = document.createElement ('td');
          td.className = 'packet-field continue continue-start continue-end';
          td.colSpan = options.width;
          itemWidth -= options.width;
          td.textContent = '(cont.)';
          td.title = title;
          tr.appendChild (td);
          tbody.appendChild (tr);
        }

        if (itemWidth > 0) {
          tr = document.createElement ('tr');
          var td = lastTD = document.createElement ('td');
          td.className = 'packet-field continue continue-start';
          td.colSpan = itemWidth;
          td.textContent = '(cont.)';
          td.title = title;
          tr.appendChild (td);
          tbody.appendChild (tr);
          current = itemWidth;
        } else {
          tbody.lastChild.lastChild.className = 'packet-field continue-start';
        }
      } else {
        mainTD = lastTD = document.createElement ('td');
        mainTD.className = 'packet-field';
        mainTD.colSpan = itemWidth;
        current += itemWidth;
        tr.appendChild (mainTD);
      }
      if (item.more) {
        if (current >= options.width) {
          lastTD.classList.add ('continue-more');
        } else {
          lastTD.classList.add ('continue-end');
        }
      }

      mainTD.title = title;
      Array.prototype.map.apply (item.container.childNodes, [function (_) { return _ }]).forEach (function (node) {
        mainTD.appendChild (node.cloneNode (true));
      });

      if (current >= options.width) {
        tr = document.createElement ('tr');
        tbody.appendChild (tr);
        current = 0;
      }
      start = end;
    });

    if (dl) dl.parentNode.removeChild (dl);
    fig.replaceChild (table, ol);
  }; // parse
}) (); // SW.Figure.Packet

SW.Figure.Amazon = {};

SW.Figure.Amazon.createItems = function (q, code) {
  var xhr = new XMLHttpRequest;
  xhr.open ('GET', 'https://asw-swapp.rhcloud.com/amazon/items?q=' + encodeURIComponent (q), true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        var json = JSON.parse (xhr.responseText);
        var df = document.createDocumentFragment ();
        json.items.forEach (function (item) {
          var fig = document.createElement ('span');
          fig.className = 'amazon-item';
          fig.setAttribute ('onclick', ' querySelector ("a").click () ');
          fig.innerHTML = '<img src alt> <a href><cite class=title></cite></a> <span class=authors></span>';
          fig.querySelector ('.title').textContent = item.Title;
          fig.querySelector ('a').href = item.short_url;
          fig.querySelector ('img').src = item.SmallImage || '';
          var authorContainer = fig.querySelector ('.authors');
          [item.Artist, item.Author, item.Director, item.Creator, item.Manufacturer].forEach (function (list) {
            (list || []).forEach (function (x) {
              var a = document.createElement ('a');
              a.href = '/n/' + encodeURIComponent (x);
              a.textContent = x;
              authorContainer.appendChild (a);
            });
          });
          df.appendChild (fig);
        });
        code (df);

        var footer = document.querySelector ('footer.footer .copyright small') || document.body;
        var amazon = footer.querySelector ('.amazon');
        if (!amazon) {
          amazon = document.createElement ('span');
          amazon.className = 'amazon';
          footer.appendChild (amazon);
        }
        amazon.textContent = json.credit;
      }
    }
  };
  xhr.send (null);
}; // createOtems

SW.Figure.Amazon.extLink = function (a) {
  var url = a.href;
  var match = url.match (/^http:\/\/www.amazon.co.jp\/(?:[^\/]+\/dp|dp|gp\/product|exec\/obidos\/ASIN)\/([A-Z0-9]{10})/);
  if (match) {
    var asin = match[1];
    SW.Figure.Amazon.createItems (asin, function (items) {
      a.parentNode.parentNode.replaceChild (items, a.parentNode);
    });
  }
}; // extLink

SW.Figure.Amazon.itemList = function (a) {
  SW.Figure.Amazon.createItems (a.textContent, function (items) {
    a.textContent = "";
    a.appendChild (items);
  });
}; // itemList

function initFigures (root) {
  var figs = root.querySelectorAll ('figure.states');
  if (figs.length) {
    var script = document.createElement ('script');
    script.src = '/scripts/springy';
    script.onload = function () {
      for (var i = 0; i < figs.length; i++) {
        SW.Figure.States (figs[i]);
      }
    };
    document.body.appendChild (script);
  }

  var rfigs = root.querySelectorAll ('figure.railroad');
  if (rfigs.length) {
    var script = document.createElement ('script');
    script.src = '/scripts/railroad';
    script.onload = function () {
      for (var i = 0; i < rfigs.length; i++) {
        SW.Figure.Railroad (rfigs[i]);
      }
    };
    document.body.appendChild (script);
  }

  Array.prototype.forEach.apply (root.querySelectorAll ('figure.sequence'), [function (fig) {
    var caps = fig.querySelectorAll ('figcaption');
    SW.Figure.Sequence.parseItems (fig);
    Array.prototype.forEach.apply (caps, [function (n) {
      fig.appendChild (n);
    }]);
  }]);

  Array.prototype.forEach.apply (root.querySelectorAll ('figure.packet'), [function (fig) {
    SW.Figure.Packet.parse (fig);
  }]);

  Array.prototype.forEach.call (root.querySelectorAll ('.sw-anchor-external-container a[href^="http://www.amazon.co.jp/"]'), function (a) {
    SW.Figure.Amazon.extLink (a);
  });

  Array.prototype.forEach.call (root.querySelectorAll ('figure.amazon'), function (a) {
    SW.Figure.Amazon.itemList (a);
  });
} // initFigures

/* 

Copyright 2002-2014 Wakaba <wakaba@suikawiki.org>.

This library is free software; you can redistribute it and/or modify
it under the same terms as Perl itself.

*/
