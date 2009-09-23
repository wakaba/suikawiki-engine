if (!self.SW) self.SW = {};

SW.CurrentDocument = new SAMI.Class (function () {
  var self = this;
  var path = location.pathname;
  path = path.replace (/;([^;\/]*)$/, function (_, v) {
    self.param = decodeURIComponent (v.replace (/\+/g, '%2F'));
    return '';
  });
  path = path.replace (/\$([^$\/]*)$/, function (_, v) {
    self.dollar = decodeURIComponent (v.replace (/\+/g, '%2F'));
    return '';
  });
  path = path.replace (/\/([^\/]*)$/, function (_, v) {
    self.name = decodeURIComponent (v.replace (/\+/g, '%2F'));
    return '';
  });
  path = path.replace (/\/([^\/]*)$/, function (_, v) {
    self.area = decodeURIComponent (v.replace (/\+/g, '%2F'));
    return '';
  });
  this.wikiPath = path;
}, {
  constructURL: function (area, name, dollar, param) {
    var p = this.wikiPath;

    area = area || this.area;
    p += '/' + encodeURIComponent (area).replace (/%2F/g, '+');

    name = name || this.name;
    p += '/' + encodeURIComponent (name).replace (/%2F/g, '+');

    dollar = dollar === undefined ? this.dollar : dollar;
    if (dollar != null) p += '$' + encodeURIComponent (dollar).replace (/%2F/g, '+');

    param = param === undefined ? this.param : param;
    if (param != null) p += ';' + encodeURIComponent (param).replace (/%2F/g, '+');

    return p;
  } // constructURL
}); // CurrentDocument

SW.CurrentDocument.getDocumentId = function () {
  var el = document.body;
  if (!el) return null;
  
  var value = el.getAttribute ('data-doc-id');
  if (!value) return null;

  return parseInt (value);
}; // getDocumentId

SW.CurrentDocument.getInstance = function () {
  if (!SW.CurrentDocument._instance) {
    SW.CurrentDocument._instance = new SW.CurrentDocument;
  }
  return SW.CurrentDocument._instance;
}; // getInstance

SW.SearchResult = new SAMI.Class (function (source) {
  this.parse (source);
}, {
  parse: function (source) {
    this.entries = new SAMI.List (source.split (/\x0D?\x0A/)).map (function (v) {
      if (v == '') return;
      return new SW.SearchResult.Entry (v.split (/\t/, 3));
    }).grep (function (v) { return v });
  }, // parse

  toOL: function () {
    var ol = document.createElement ('ol');
    ol.className = 'swe-links';
    this.entries.forEach (function (entry) {
      ol.appendChild (entry.toLI ());
    });
    return ol;
  } // toOL
}); // SearchResult

SW.SearchResult.Entry = new SAMI.Class (function (v) {
  this.score = v[0];
  this.docId = v[1];
  this.docName = v[2];
}, {
  toLI: function () {
    var li = document.createElement ('li');
    li.innerHTML = '<a href="">xxx</a>';
    li.firstChild.firstChild.data = this.docName;
    li.firstChild.href = SW.CurrentDocument.getInstance ().constructURL
        ('n', this.docName, this.docId);
    return li;
  } // toLI
}); // SearchResult.Entry

SW.Neighbors = new SAMI.Class (function (id, source) {
  this.documentId = id;
  this.parse (source);
}, {
  parse: function (source) {
    var id = this.documentId;
    this.entries = new SAMI.List (source.split (/\x0D?\x0A/)).map (function (v) {
      if (v == '') return;
      return new SW.Neighbors.Entry (v.split (/\t/, 2), id);
    }).grep (function (v) { return v });
  }, // parse

  toUL: function () {
    var ol = document.createElement ('ul');
    ol.className = 'swe-links';
    this.entries.forEach (function (entry) {
      ol.appendChild (entry.toLI ());
    });
    return ol;
  } // toUL
}); // Neighbors

SW.Neighbors.Entry = new SAMI.Class (function (v, id) {
  this.docId = v[0];
  this.docName = v[1];
  this.sourceDocId = id;
}, {
  toLI: function () {
    var self = this;
    var doc = SW.CurrentDocument.getInstance ();

    var li = document.createElement ('li');
    li.innerHTML = '<a href="">xxx</a> <button type=button class=swe-unrelated>X</button>';
    var a = li.firstChild;
    a.firstChild.data = this.docName;
    a.href = doc.constructURL ('n', this.docName, this.docId);

    // XXX We don't use the real |ping| attribute for now since there
    // is no reliable way to know whether the browser does or does not
    // send ping and therefore we have to send the ping using a custom
    // script code anyway.

    // Use |GET| method instead of |POST| method to not require Basic auth.
    a.onclick = function () {
      var pingURL = doc.constructURL
          ('i', self.sourceDocId, null, 'related-' + self.docId);
      new SAMI.XHR (pingURL).get ();

      var url = a.href;
      setTimeout (function () {
        location.href = url;
      }, 500);

      return false;
    }; // a.onclick

    var button = li.lastChild;
    button.onclick = function () {
      var pingURL = doc.constructURL
          ('i', self.sourceDocId, null, 'unrelated-' + self.docId);
      new SAMI.XHR (pingURL).get ();
      li.parentNode.removeChild (li);
    }; // button.onclick

    return li;
  } // toLI
}); // Neighbors.Entry

SW.PageContents = new SAMI.Class (function () {
  this.footer = document.getElementsByTagName ('footer')[0];
}, {
  insertSection: function (sectionId, content) {
    var sectionName = {
      'search-results': 'Related pages',
      'neighbors': 'Nearby'
    }[sectionId] || sectionId;
    var section = document.createElement ('section');
    section.id = sectionId;
    var h = document.createElement ('h2');
    h.innerHTML = 'xxx';
    h.firstChild.data = sectionName;
    section.appendChild (h);
    section.appendChild (content);
    document.body.insertBefore (section, this.footer);
  } // insertSection
}); // PageContents

SW.PageContents.getInstance = function () {
  if (!this._instance) {
    this._instance = new SW.PageContents;
  }
  return this._instance;
}; // getInstance

var CanvasInstructions = new SAMI.Class(function (canvas) {
  this.canvas = canvas;
}, {
  clear: function () {
    this.canvas.width = this.canvas.width;
  }, // clear

  processText: function (text) {
    text = text.replace (/^<!--/, '').replace (/-->$/, '');
    this.processLines (text.split(/\x0D\x0A?|\x0A/));
  }, // processText

  processLines: function (lines) {
    var ctx = this.canvas.getContext ('2d');
    for (var i = 0; i < lines.length; i++) {
      var ev = lines[i].split (/,/);
      if (ev[0] == 'lineTo') {
        var x = parseFloat (ev[1]);
        var y = parseFloat (ev[2]);
        ctx.lineTo (x, y);
        ctx.stroke ();
//        ctx.closePath ();
//        ctx.beginPath ();
//        ctx.moveTo (x, y);
      } else if (ev[0] == 'moveTo') {
        var x = parseFloat (ev[1]);
        var y = parseFloat (ev[2]);
        ctx.moveTo (x, y);
      } else if (ev[0] == 'strokeStyle' || ev[0] == 'lineWidth') {
        ctx.closePath ();
        ctx.beginPath ();
        ctx[ev[0]] = ev[1];
      }
    }
  } // processLines
}); // CanvasInstructions

SW.Drawings = {};
SAMI.Class.addClassMethods (SW.Drawings, {
  drawCanvases: function () {
    var canvases = SAMI.Node.getElementsByClassName (document.body, 'swe-canvas-instructions');
    canvases.forEach(function (canvas) {
      var script = canvas.firstChild;
      if (!script) return;
      if (script.nodeName.toLowerCase () != 'script') return;
      if (script.type != 'image/x-canvas-instructions+text') return;
      var text = SAMI.Element.getTextContent (script);
      new CanvasInstructions (canvas).processText (text);
    });
  } // drawCanvases
}); // SW.Drawings

SW.init = function () {
  var doc = SW.CurrentDocument.getInstance ();
  if (doc.area == 'n') {
    var searchURL = doc.constructURL (null, null, null, 'search');

    new SAMI.XHR (searchURL, function () {
      var sr = new SW.SearchResult (this.getText ());
      if (sr.entries.list.length) {
        var ol = sr.toOL ();
        SW.PageContents.getInstance ().insertSection ('search-results', ol);
      }
    }).get ();

    if (location.href.match(/-temp/)) { // XXX

    var id = SW.CurrentDocument.getDocumentId ();
    if (id) {
      var neighborsURL = doc.constructURL ('i', id, null, 'neighbors');
      new SAMI.XHR (neighborsURL, function () {
        var sr = new SW.Neighbors (id, this.getText ());
        if (sr.entries.list.length) {
          var ol = sr.toUL ();
          SW.PageContents.getInstance ().insertSection ('neighbors', ol);
        }
      }).get ();
    }

    }

    SW.Drawings.drawCanvases ();
  }

}; // init
