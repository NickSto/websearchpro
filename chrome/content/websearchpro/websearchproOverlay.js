/* ***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Original Code is Web Search Pro code.

The Initial Developer of the Original Code is Martijn Kooij a.k.a. Captain Caveman.

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.

***** END LICENSE BLOCK ***** */

var WSProOverlay = {
    WSProSEDragDropItemObserver: {
        onDragStart: function (evt, transferData, action) {
            var oElement = evt.target;
            if (!oElement.getAttribute("fseid")) oElement = oElement.parentNode;

            var sData = oElement.getAttribute("fseid");
            transferData.data = new TransferData();
            transferData.data.addDataForFlavour("text/unicode", sData);
        }
    },

    WSProDragDropObserver: {
        getSupportedFlavours: function () {
            var oFS = new FlavourSet();
            oFS.appendFlavour("text/unicode");
            oFS.appendFlavour("text/x-moz-url");
            return oFS;
        },

        onDragOver: function (evt, flavour, session) {
            WSProOverlay.WSProStoreMousePos(evt);

            if (session.isDataFlavorSupported("text/unicode") || session.isDataFlavorSupported("text/x-moz-url")) {
                if (!WSProOverlay.GetDragUseDropZones() || WSProOverlay.GetDragUseDropZones() == 0) {
                    WSProOverlay.SetDragUseDropZones(-1);
                    if (!session.sourceNode || typeof(session.sourceNode.getAttribute) != "function" || !session.sourceNode.getAttribute('wspromenutype')) {
                        var bIsURI = false;
                        try
                        {
                            var oTrans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
                            var oUnicode;
                            var aData = {};
                            var aLength = {};

                            try
                            {
                                oTrans.addDataFlavor("text/x-moz-url");
                                session.getData(oTrans, 0);
                                oTrans.getTransferData("text/x-moz-url", aData, aLength);
                            }
                            catch (e)
                            {
                                oTrans.addDataFlavor("text/unicode");
                                session.getData(oTrans, 0);
                                oTrans.getTransferData("text/unicode", aData, aLength);
                            }
                            oUnicode = aData.value.QueryInterface(Components.interfaces.nsISupportsString);
                            sData = oUnicode.data.substring(0, aLength.value / 2);

                            var oIOS = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
                            var oURI = oIOS.newURI(sData,null,null);
                            oURI.host; //Will fail if it's not a URI...
                            bIsURI = true;
                        }
                        catch (e) {bIsURI = false;}

                        WSProOverlay.SetDragUseDropZones(1);
                    }
                }
                if (WSProOverlay.GetDragUseDropZones() == 1) {
                    if (!WSProOverlay.GetDragInitialized()) {
                        WSProOverlay.WSProUpdateDropZones('show');
                        WSProOverlay.WSProCheckDZStillDragging();
                        WSProOverlay.SetDragInitialized(true);
                    }
                    WSProOverlay.WSProUpdateDropZones('highlight', evt.clientX, evt.clientY);
                    session.canDrop = true;
                    return session.canDrop;
                } else if (WSProOverlay.GetDragUseDropZones() == 2) {
                    session.canDrop = true;
                    return session.canDrop;
                }
            }

            var oElements;
            var oElement;
            var sSourceMenuType, sDestMenuType;
            var iIndex, iLen;

            oElement = evt.target;
            if (!oElement.getAttribute("fseid")) oElement = oElement.parentNode;

            if (session.sourceNode && typeof(session.sourceNode.getAttribute) == "function" && session.sourceNode.getAttribute('fsetype')) sSourceFSEType = session.sourceNode.getAttribute('fsetype');
            if (oElement.getAttribute('fsetype')) sDestFSEType = oElement.getAttribute('fsetype');

            session.canDrop = false;
            if (sSourceFSEType == sDestFSEType || !sDestFSEType || WSProOverlay.GetMenuStyle() == "flat") {
                if (session.isDataFlavorSupported("text/unicode") && oElement.className.indexOf('mmsearch_freesearch') >= 0) {
                    if (oElement.nextSibling && oElement.nextSibling.getAttribute('menutype') != "" && oElement.nextSibling.id.indexOf("clone-mmsearch-searchfreesearch") == -1) {
                        oElement.setAttribute("dragstate", "top");
                    } else {
                        var iMid = oElement.boxObject.screenY + (oElement.boxObject.height / 2);
                        var iMouse = (evt.screenY);
                        if (iMouse < iMid) {
                            oElement.setAttribute("dragstate", "top");
                        } else {
                            oElement.setAttribute("dragstate", "bottom");
                        }
                    }
                    session.canDrop = true;
                }
            }

            oElements = document.getElementsByAttribute("dragstate", "top");
            iLen = oElements.length;
            for (iIndex = 0; iIndex < iLen; iIndex++) {
                if (oElements[iIndex] && oElements[iIndex].id != oElement.id) oElements[iIndex].setAttribute("dragstate", "");
            }
            oElements = document.getElementsByAttribute("dragstate", "bottom");
            iLen = oElements.length;
            for (iIndex = 0; iIndex < iLen; iIndex++) {
                if (oElements[iIndex] && oElements[iIndex].id != oElement.id) oElements[iIndex].setAttribute("dragstate", "");
            }

            if (session.canDrop) {
                evt.stopPropagation();
                evt.preventDefault();
            }

            return true;
        },

        onDrop: function (evt, dropdata, session) {
            var oElement;

            session.canDrop = false;
            oElement = evt.target;
            if (!oElement.getAttribute("fseid")) {
                oElement = oElement.parentNode;
                if (oElement && (typeof(oElement.getAttribute) != "function" || !oElement.getAttribute("fseid"))) oElement = null;
            }

            if (!oElement) {
                var oTrans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
                var oUnicode;
                var aData = {};
                var aLength = {};
                var sData = "";

                try
                {
                    oTrans.addDataFlavor("text/x-moz-url");
                    session.getData(oTrans, 0);
                    oTrans.getTransferData("text/x-moz-url", aData, aLength);
                    oUnicode = aData.value.QueryInterface(Components.interfaces.nsISupportsString);
                    sData = oUnicode.data.substring(0, aLength.value / 2);
                    sData = DenDZonesShell.GetURISource(sData);
                    if (!sData) sData = "";
                }
                catch (e) {sData = "";}
                if (sData == "")
                {
                    try
                    {
                        oTrans.addDataFlavor("text/unicode");
                        session.getData(oTrans, 0);
                        oTrans.getTransferData("text/unicode", aData, aLength);
                        oUnicode = aData.value.QueryInterface(Components.interfaces.nsISupportsString);
                        sData = oUnicode.data.substring(0, aLength.value / 2);
                    }
                    catch (e) {sData = transferUtils.retrieveURLFromData(dropdata.data, dropdata.flavour.contentType);}
                }

                if (sData) {
                    var bIsURI = false;
                    if (session.sourceNode && session.sourceNode.nodeName == "A") {
                        sData =  session.sourceNode.text;
                        bIsURI = true;
                    }
                    //It's a URI, but if SuperDrag is not installed, we will use the text for our D&D operation.
                    if (!bIsURI || (typeof(superDrag) != "object" && typeof(DragdeGoDNDObserver) != "object" && typeof(QuickDrag) != "object" && typeof(easyDragToGo) != "object")) {
                        WSProOverlay.WSProDragDropDZSearch(sData, evt.clientX, evt.clientY, evt.target.id);
                        session.canDrop = true;
                    }
                }
            } else {
                var oElements;

                var sDroppedFSEID;
                var sTargetFSEID;
                var iIndex, iLen;

                if (dropdata && dropdata.data && dropdata.data != "") {
                    sDroppedFSEID = dropdata.data;

                    if (oElement.className.indexOf('mmsearch_freesearch') >= 0) {
                        sTargetFSEID = oElement.getAttribute('fseid');
                        if (oElement.getAttribute("dragstate") != "top") sTargetFSEID = "_after_" + sTargetFSEID;
                    }
                    WSProOverlay.WSProDragMoveSE(sDroppedFSEID, sTargetFSEID, oElement.id.substr(0, 2) == "ct");
                    WSProOverlay.SetDragInitialized(true);
                    session.canDrop = true;
                }
                oElements = document.getElementsByAttribute("dragstate", "top");
                iLen = oElements.length;
                for (iIndex = 0; iIndex < iLen; iIndex++) {
                    oElements[iIndex].setAttribute("dragstate", "");
                }
                oElements = document.getElementsByAttribute("dragstate", "bottom");
                iLen = oElements.length;
                for (iIndex = 0; iIndex < iLen; iIndex++) {
                    oElements[iIndex].setAttribute("dragstate", "");
                }
            }

            if (session.canDrop) {
                evt.stopPropagation();
                evt.preventDefault();
            }

            WSProOverlay.WSProUpdateDropZones('destroy');
            WSProOverlay.SetDragInitialized(false);
            WSProOverlay.SetDragUseDropZones(0);

            session.canDrop = true;
            return true;
        },

        onDragExit: function (evt, session) {
            if (session.sourceNode && session.sourceNode.localName == "tab") {
                return true;
            }

            if (WSProOverlay.WSProCheckDropZonesExit(evt)) {
                WSProOverlay.SetDragInitialized(false);
                WSProOverlay.SetDragUseDropZones(0);
            }
            return true;
        }
    },

    MMSearchObserver: {
        observe: function (subject, topic, state) {
            if (topic == "apply-settings" && state == 'OK') {
                setTimeout(function() {
                    if (typeof(WSProOverlay.MMSearchInitToolbar) == "function") {
                        WSProOverlay.MMSearchInitToolbar(true);
                        WSProOverlay.MMSearchHideDefaultFirefoxWebSearch();
                        WSProOverlay.WSProHideItems();
                        WSProOverlay.WSProInitShortcuts();
                        WSProOverlay.WSProInitDropZones();
                        WSProOverlay.WSProUpdateToggleDenDButton();
                    }
                }, 500);
            }
        }
    },

    WSProFFSearchEngineObserver: {
        observe: function (oEngine, sTopic, sEvent) {
            if (typeof(document.defaultView.WSProOverlay.WSProFFSearchEngineListener) == "function") document.defaultView.WSProOverlay.WSProFFSearchEngineListener(sEvent, oEngine);
        }
    },

    WSProUninstallObserver: {
        observe: function (subject, topic, data) {
            if (topic == "em-action-requested" && data == "item-uninstalled") {
                var oUpdateItem = subject.QueryInterface(Components.interfaces.nsIUpdateItem);
                if (oUpdateItem.id == "{8B8A525A-CFCA-44cf-81C3-3969E6CB96E0}") {
                    WSProOverlay.WProUninstall();
                }
            }
        }
    },

    ClearHistoryController: {
        supportsCommand: function (cmd) {
            if (cmd == "cmd_wspro_clearhistory") return true;
            return false;
        },
        isCommandEnabled: function (cmd) {
            if (cmd == "cmd_wspro_clearhistory") {
                if ("nsIFormHistory2" in Components.interfaces) {
                    var oFormHistory = Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory2);
                } else {
                    var oFormHistory = Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory);
                }

                return oFormHistory.nameExists("mmsearch-history");
            }
            return false;
        },
        doCommand: function (cmd) {
            if (cmd == "cmd_wspro_clearhistory") {
                if ("nsIFormHistory2" in Components.interfaces) {
                    var oFormHistory = Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory2);
                } else {
                    var oFormHistory = Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory);
                }
                oFormHistory.removeEntriesForName("mmsearch-history");
            }
        },
        onEvent: function (evt) {}
    },
    
    EditActiveSEController: {
        supportsCommand: function (cmd) {
            if (cmd == "cmd_wspro_editactivese") return true;
            return false;
        },
        isCommandEnabled: function (cmd) {
            if (cmd == "cmd_wspro_editactivese") return true;
            return false;
        },
        doCommand: function (cmd) {
            if (cmd == "cmd_wspro_editactivese" && typeof(WSProOverlay.WSProEditActiveSE) == "function") WSProOverlay.WSProEditActiveSE();
        },
        onEvent: function (evt) {}
    },

    WSProDragOver: function (oEvent) {
        var sDropData = "";

        try {
            var fGetDragData = function (aFlavourSet) {
                var supportsArray = Components.classes["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);
                if (nsDragAndDrop.mDragSession) {
                    for (var i = 0; i < nsDragAndDrop.mDragSession.numDropItems; ++i) {
                        var trans = nsTransferable.createTransferable();
                        for (var j = 0; j < aFlavourSet.flavours.length; ++j) trans.addDataFlavor(aFlavourSet.flavours[j].contentType);
                        nsDragAndDrop.mDragSession.getData(trans, i);
                        supportsArray.AppendElement(trans);
                    }
                }
                return supportsArray;
            };

            var flavourSet = WSProOverlay.WSProDragDropObserver.getSupportedFlavours();
            var transferData = nsTransferable.get(flavourSet, fGetDragData, true);
            var oDropData = transferData.first.first;
            var sDropData = transferUtils.retrieveURLFromData(oDropData.data, oDropData.flavour.contentType);
        }
        catch(e) {
            sDropData = "";
        }

        var oSession = nsDragAndDrop.mDragSession;
        if (!oSession) nsDragAndDrop.mDragService.getCurrentSession()
        var iResult = WSProOverlay.WSProHandleThisDenDOperation(oEvent, oSession, sDropData);
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProHandleThisDenDOperation result: " + iResult);
        
        if (iResult == 1 && WSProOverlay.WSProCheckDZHandlesThisDrag(oEvent)) {
            nsDragAndDrop.dragOver(oEvent, WSProOverlay.WSProDragDropObserver);
        }
    },

    WSProDrop: function (oEvent) {
        var sDropData = "";

        try {
            var fGetDragData = function (aFlavourSet) {
                var supportsArray = Components.classes["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);
                if (nsDragAndDrop.mDragSession) {
                    for (var i = 0; i < nsDragAndDrop.mDragSession.numDropItems; ++i) {
                        var trans = nsTransferable.createTransferable();
                        for (var j = 0; j < aFlavourSet.flavours.length; ++j) trans.addDataFlavor(aFlavourSet.flavours[j].contentType);
                        nsDragAndDrop.mDragSession.getData(trans, i);
                        supportsArray.AppendElement(trans);
                    }
                }
                return supportsArray;
            };

            var flavourSet = WSProOverlay.WSProDragDropObserver.getSupportedFlavours();
            var transferData = nsTransferable.get(flavourSet, fGetDragData, true);
            var oDropData = transferData.first.first;
            var sDropData = transferUtils.retrieveURLFromData(oDropData.data, oDropData.flavour.contentType);
        }
        catch(e) {
            sDropData = "";
        }

        if (!WSProOverlay.WSProCheckDZHandlesThisDrop(oEvent)) {
            WSProOverlay.WSProUpdateDropZones('destroy');
        }
        var oSession = nsDragAndDrop.mDragSession;
        if (!oSession) nsDragAndDrop.mDragService.getCurrentSession()
        var iResult = WSProOverlay.WSProHandleThisDenDOperation(oEvent, oSession, sDropData);
        if (iResult == 1) {
            nsDragAndDrop.drop(oEvent, WSProOverlay.WSProDragDropObserver);
        }
    },

    WSProDragDropExit: function (oEvent) {
        nsDragAndDrop.dragExit(oEvent, WSProOverlay.WSProDragDropObserver);
    },

    WSProHandleThisDenDOperation: function (oEvent, oSession, sData) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProHandleThisDenDOperation('" + oEvent.target.id + "', '" + sData + "')");
        if (!WSProOverlay.oUtils.GetBool("mmsearch-searchondrop") && oEvent.target.id == "MMSearchTBTextbox") {
            var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
            if (oEvent.target.value == sTT) oEvent.target.value = sData;
        }

        if (oEvent.shiftKey || (!WSProOverlay.oUtils.GetBool("mmsearch-droptextanywhere") && !WSProOverlay.oUtils.GetBool("mmsearch-searchondrop"))) return -1;
        if (!sData) return -1;
        if (oSession && oSession.isDataFlavorSupported("application/x-moz-file")) {
            //Dragged text on Ubuntu can also be saved as txt file.
            if (!oSession.isDataFlavorSupported("text/unicode")) return -2;
        }
        if (oSession && oSession.sourceNode && oSession.sourceNode.localName == "tab") return -3;
        if (oEvent.originalTarget.prefix == "xul") return -3; //Not inside html content anymore.
        if (!WSProOverlay.oUtils.GetBool("mmsearch-searchondrop") && oEvent.target.id == "MMSearchTBTextbox") {
            var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
            if (oEvent.target.value == sTT) oEvent.target.value = "";
            return -4;
        }

        var bIsURI = false;
        try {
            var oIOS = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
            var oURI = oIOS.newURI(sData,null,null);
            oURI.host; //Will fail if it's not a URI...

            //sData = WSProOverlay.GetURISource(sData);
            //oURI = oIOS.newURI(sData, null, null);
            //oURI.host; //Will fail if it's not a URI...
            bIsURI = true;
        }
        catch(e) {
            bIsURI = false;
        }
        if (bIsURI) {
            //It's a URI, but if SuperDrag is not installed, we will use the text for our D&D operation.
            if (typeof(superDrag) == "object" || typeof(DragdeGoDNDObserver) == "object" || typeof(QuickDrag) == "object" || typeof(easyDragToGo) == "object") {
                return -5;
            }
        }

        return 1;
    },

    GetURISource: function(sURIData)
    {
        var aData = sURIData.split('\n');
        if (aData.length = 2) return aData[1];
        return sURIData;
    },

    WSProDragMoveSE: function (sDroppedFSEID, sTargetFSEID, bFromContextMenu) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProDragMoveSE(" + sDroppedFSEID + ", " + sTargetFSEID + ", " + bFromContextMenu + ")");
        var iTargetIndex, iDroppedIndex, iAddToIndex = 0;

        iDroppedIndex = WSProOverlay.WSProGetFSEIDIndex(sDroppedFSEID);
        if (iDroppedIndex >= 0) {
            var aSearchEngine = this.aFreeSearchEngines.splice(iDroppedIndex, 1)[0]; //Remove the SE.
            if (sTargetFSEID.indexOf("_after_") >= 0) {
                iAddToIndex = 1;
                sTargetFSEID = sTargetFSEID.replace("_after_", "");
            }
            iTargetIndex = WSProOverlay.WSProGetFSEIDIndex(sTargetFSEID) + iAddToIndex;

            if (iTargetIndex < 0) iTargetIndex = 0;
            this.aFreeSearchEngines.splice(iTargetIndex, 0, aSearchEngine); //Insert the SE.
            WSProOverlay.oUtils.SetLocalizedString("mmsearch-freesearchengines", WSProOverlay.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
            WSProOverlay.MMSearchInitToolbar(true);
            if (bFromContextMenu) {
                if (document.getElementById('mmsearchpopupsearchengine')) document.getElementById('mmsearchpopupsearchengine').hidePopup();
                WSProOverlay.PopupMMSearch();
            }
        }
    },

    MMSearchPreInit: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("Pre Initializing");
        if (!WSProOverlay.oUtils && !this.bInitializing) {
            this.bInitializing = true;
            setTimeout(function () {WSProOverlay.MMSearchInit();}, 500);
        }
    },

    MMSearchInit: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("Initializing");

        this.oContextPopupNode = null;

        this.aFreeSearchEngines = null;
        this.aFreeSearchGroups = null;
        this.aKeyboardShortcuts = null;
        this.aDropZones = null;
        this.aFadeOutDropZones = new Array();
        this.aLastQTSSearchEngines = new Array();
        this.aLastQTSDynamicSearchParams = new Array();
        
        this.sCurrentSearchText = "";
        this.sLastSearchBoxContent = "";
        this.sLastQTSSearchTerm = "";
        this.sWSProHoverText = "";
        this.sCurrentSearchType = "";

        this.sWSProDefaultEncoding = "UTF-8";
        this.iLastHighlightedDropZoneX = -1;
        this.iLastHighlightedDropZoneY = -1;
        this.iWSProHoverTextIndex = 0;
        this.iDropZoneMaxAxis = 4;

        this.bForegroundKeyDown = false;
        this.bBackgroundKeyDown = false;
        this.bNewTabKeyDown = false;
        this.bCurrentTabKeyDown = false;
        this.bWSProDisableInstantApply = WSProOverlay.WSProGetInstantApply();
        this.bDisableHidePopups = false;

        //Settings observer.
        var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService)
        oObService.addObserver(WSProOverlay.MMSearchObserver, "apply-settings", false);
        //Firefox Web Search Engine Observer (called from nsSearchService.js)
        oObService.addObserver(WSProOverlay.WSProFFSearchEngineObserver, "browser-search-engine-modified", false);

        /*Add an observer for the uninstall event*/
        oObService.addObserver(WSProOverlay.WSProUninstallObserver, "em-action-requested", false);

        //Init Utils.
        WSProOverlay.oUtils = new MMSearchUtils();

        window.addEventListener("keydown", WSProOverlay.WSProLogActionKeysDown, false);
        window.addEventListener("keyup", WSProOverlay.WSProLogActionKeysUp, false);
        window.addEventListener("mousemove", WSProOverlay.WSProSaveHoverText, false);
        window.addEventListener("WSProSearchEngineEvent", WSProOverlay.WSProSearchEngineListener, false, true);

        if (document.getElementById("FindToolbar") && document.getElementById("FindToolbar")._findField) {
            document.getElementById("FindToolbar")._findField.addEventListener("keypress", WSProOverlay.WSProFastFindKeyPress, false);
        } else {
            var oBottomBox = document.getElementById("browser-bottombox");
            if (oBottomBox) {
                oBottomBox.addEventListener("DOMNodeInserted", function() {
                    if (document.getElementById("FindToolbar") && document.getElementById("FindToolbar")._findField) {
                        document.getElementById("FindToolbar")._findField.addEventListener("keypress", WSProOverlay.WSProFastFindKeyPress, false);
                    }
                }, false);
            }
        }
        

        //Call PopupMMSearch each time the contentmenu is opened.
        if (document.getElementById("contentAreaContextMenu")) {
            document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", WSProOverlay.PopupMMSearch, false);
            document.getElementById("contentAreaContextMenu").addEventListener("popuphidden", WSProOverlay.WSProContextMenuHidden, false);
            document.getElementById('contentAreaContextMenu').setAttribute("wspro_isvisible", "false");
        }

        if (WSProOverlay.oUtils.GetBool("mmsearch-droptextanywhere") == true) {
            getBrowser().mPanelContainer.addEventListener('dragover', WSProOverlay.WSProDragOver, true);
            getBrowser().mPanelContainer.addEventListener('dragdrop', WSProOverlay.WSProDrop, true);
            getBrowser().mPanelContainer.addEventListener('drop', WSProOverlay.WSProDrop, true);
            getBrowser().mPanelContainer.addEventListener('dragexit', WSProOverlay.WSProDragDropExit, true);
        }
        var oBrowser = document.getElementById('content');
        if (oBrowser) {
            oBrowser.addEventListener("DOMContentLoaded", WSProOverlay.WSProCheckOpenSearchLinks, true);
            oBrowser.addEventListener("DOMTitleChanged", WSProOverlay.WSProUpdateTabLabels, true);
            var oTabs = oBrowser.tabContainer;
            if (!oTabs) {
                oTabs = oBrowser.mPanelContainer;
                oTabs.addEventListener("select", WSProOverlay.WSProCheckOpenSearchLinks, false);
            } else {
                oTabs.addEventListener("TabSelect", WSProOverlay.WSProCheckOpenSearchLinks, false);
            }
        }

        if (document.getElementById("mmsearchpopupsearchengine")) {
            document.getElementById("mmsearchpopupsearchengine").addEventListener('dragover', WSProOverlay.WSProDragOver, true);
            document.getElementById("mmsearchpopupsearchengine").addEventListener('dragdrop', WSProOverlay.WSProDrop, true);
            document.getElementById("mmsearchpopupsearchengine").addEventListener('drop', WSProOverlay.WSProDrop, true);
        }
        if (document.getElementById("mmsearchcontextsearchengines")) {
            document.getElementById("mmsearchcontextsearchengines").addEventListener('dragover', WSProOverlay.WSProDragOver, true);
            document.getElementById("mmsearchcontextsearchengines").addEventListener('dragdrop', WSProOverlay.WSProDrop, true);
            document.getElementById("mmsearchcontextsearchengines").addEventListener('drop', WSProOverlay.WSProDrop, true);
        }

        //Call MMSearchScrollEngines each time you scroll over the toolbar textbox.
        var oTextBox = document.getElementById("MMSearchTBTextbox");
        if (oTextBox) {
            //Add scroll events for selecting a search engine.
            oTextBox.addEventListener('DOMMouseScroll', WSProOverlay.MMSearchScrollEnginesMouse, false);
            oTextBox.addEventListener('dragdrop', WSProOverlay.WSProDrop, true);
            oTextBox.addEventListener('drop', WSProOverlay.WSProDrop, true);

            var textBox = document.getAnonymousElementByAttribute(oTextBox, "anonid", "textbox-input-box");
            var oPasteMenu = document.getAnonymousElementByAttribute(textBox, "anonid", "input-box-contextmenu");
            var iIndex, iLen = oPasteMenu.childNodes.length;
            for (iIndex = 0; iIndex < iLen; iIndex++) {
                if (oPasteMenu.childNodes[iIndex].getAttribute("cmd") == "cmd_paste") {
                    oPasteMenu.childNodes[iIndex].addEventListener("command", function() {
                        setTimeout(function () {WSProOverlay.MMSearchPasteSearch();}, 100);
                     }, false);
                }
            }
            if (!document.getElementById('wspro_clearhistory')) {
                //Add a clear history menuitem.
                var oInputTextBox = document.getAnonymousElementByAttribute(oTextBox, "anonid", "textbox-input-box");
                var oInputTextBoxContext = document.getAnonymousElementByAttribute(oInputTextBox, "anonid", "input-box-contextmenu");

                var oElement;
                oElement = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', "menuseparator");
                oInputTextBoxContext.appendChild(oElement);

                oElement = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', "menuitem");
                oElement.setAttribute("id", "wspro_clearhistory");
                oElement.setAttribute("label", WSProOverlay.oUtils.TranslateString("wspro-clear-history"));
                oElement.setAttribute("cmd", "cmd_wspro_clearhistory");
                oInputTextBoxContext.appendChild(oElement);

                //Add an edit current SE menuitem.
                oElement = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', "menuitem");
                oElement.setAttribute("id", "wspro_editactivese");
                oElement.setAttribute("label", WSProOverlay.oUtils.TranslateString("wspro-editse-intro"));
                oElement.setAttribute("cmd", "cmd_wspro_editactivese");
                oInputTextBoxContext.appendChild(oElement);

                oTextBox.controllers.appendController(WSProOverlay.ClearHistoryController);
                oTextBox.controllers.appendController(WSProOverlay.EditActiveSEController);
            }
        }

        //Optionally add toolbar.
        setTimeout(function () {WSProOverlay.MMSearchAddToolbar();}, 100);
        WSProOverlay.WSProDelayedInit();

        return true;
    },

    WSProUpdateTabLabels: function (oEvent) {
        if (document.defaultView.WSProOverlay.oUtils) {
            if (document.defaultView.WSProOverlay.oUtils.GetBool("mmsearch-relabeltabs")) {
                var oBrowser = getBrowser().getBrowserForDocument(oEvent.target);
                var oTab;
                if (oBrowser) {
                    var sPanelID = oBrowser.parentNode.id;
                    oTab = document.getAnonymousElementByAttribute(getBrowser(), "linkedpanel", sPanelID);
                }
                if (!oTab) {//Firefox 4            
                    try {
                        var contentWin = oEvent.target.defaultView;
                        if (contentWin != contentWin.top) return;
                        oTab = document.defaultView.WSProOverlay.GetTabForContentWindow(contentWin);
                    } catch (e) {}
                }
                if (oTab && oTab.getAttribute('wsprolabel')) {
                    oTab.label = oTab.getAttribute('wsprolabel');

                    setTimeout(function () {
                        oTab.removeAttribute('wsprolabel');
                    },
                    5000);
                    oEvent.stopPropagation();
                }
            }
        }
    },
    
    GetTabForContentWindow: function(aWindow) {
        for (let i = 0; i < gBrowser.browsers.length; i++) {
            if (gBrowser.browsers[i].contentWindow == aWindow)
            return gBrowser.tabs[i];
        }
    },


    ClearWSProTabLabel: function (sPanelID) {
        var oTab = document.getAnonymousElementByAttribute(getBrowser(), "linkedpanel", sPanelID);
        if (oTab && oTab.getAttribute('wsprolabel')) {
            oTab.removeAttribute('wsprolabel');
        }
    },

    WSProDelayedInit: function () {
        var bToolbarDone = !WSProOverlay.oUtils.GetBool("mmsearch-checkaddtoolbarbutton") || (document.getElementById('MMSearchToolbarContainer')) || (document.getElementById('MMSearchTBQTSButton'));
        if (!bToolbarDone) return setTimeout(function () {WSProOverlay.WSProDelayedInit();}, 250);

        WSProOverlay.MMSearchHideDefaultFirefoxWebSearch();
        WSProOverlay.WSProHideItems();

        setTimeout(function () {WSProOverlay.WSProConvertFavIconsToB64();}, 100); //Start this operation async cause it can take a while...
        WSProOverlay.MMSearchInitToolbar(true);
        WSProOverlay.WSProInitShortcuts();
        WSProOverlay.WSProInitDropZones();
        WSProOverlay.WSProUpdateToggleDenDButton();
        WSProOverlay.WSProCheckOpenSearchLinks();
        
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("Initializing completed");
    },
    
    MMSearchDeInit: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("De Initializing");
        //Clean up...
        var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService)
        oObService.removeObserver(WSProOverlay.MMSearchObserver, "apply-settings");
        oObService.removeObserver(WSProOverlay.WSProFFSearchEngineObserver, "browser-search-engine-modified");
        oObService.removeObserver(WSProOverlay.WSProUninstallObserver, "em-action-requested");

        WSProOverlay.MMSearchObserver = null;
        WSProOverlay.WSProFFSearchEngineObserver = null;
        WSProOverlay.WSProUninstallObserver = null;

        var oTextBox = document.getElementById("MMSearchTBTextbox");
        if (oTextBox) {
            if (oTextBox.controllers && oTextBox.controllers.getControllerForCommand("cmd_wspro_clearhistory")) {
                oTextBox.controllers.removeController(WSProOverlay.ClearHistoryController);
            }
            oTextBox.mSearchNames = null;
            oTextBox.mController.input = null;
            WSProOverlay.ClearHistoryController = null;
        }
    },

    WProUninstall: function () {
        var oPromptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
        var bConfirm = oPromptService.confirm(window, WSProOverlay.oUtils.TranslateString('mmsearch-toolbar-msg-uninstall-title'), WSProOverlay.oUtils.TranslateString('mmsearch-toolbar-msg-uninstall-question'));
        if (bConfirm) {
            Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).deleteBranch("extensions.mmsearch");
        }
    },

    WSProInitFreeSearchEngineGroups: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProInitFreeSearchEngineGroups");
        this.aFreeSearchGroups = null;
        this.aFreeSearchGroups = new Array();
        var oPopupTB = document.getElementById('mmsearchpopupsearchengine');
        var oItemBeforeTB = document.getElementById('tb-group-wspro-clone');
        var oPopupCT = document.getElementById('mmsearchcontextsearchengines');
        var oItemBeforeCT = document.getElementById('ct-group-wspro-clone');

        var aTemp = new Array();
        var oItem;
        var sFavIconURI = "";
        aTemp = WSProOverlay.oUtils.GetLocalizedString("mmsearch-freesearchgroups").split('f_g');
        var iIndex, iLen = aTemp.length;
        var bConvertedFavIcon = false;
        var bFavIconWasEmpty = false;

        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (aTemp[iIndex] != "") {
                this.aFreeSearchGroups[iIndex] = new Array();
                this.aFreeSearchGroups[iIndex] = aTemp[iIndex].split('f_v');
                if (!this.aFreeSearchGroups[iIndex][2] || this.aFreeSearchGroups[iIndex][2] == "") bFavIconWasEmpty = true;
                oItem = document.getElementById("wspro-version24info-" + this.aFreeSearchGroups[iIndex][0]);
                if (oItem) {
                    this.aFreeSearchGroups[iIndex][1] = oItem.getAttribute('fselabel');
                    this.aFreeSearchGroups[iIndex][2] = oItem.getAttribute('fseicon');
                }
                //Custom group, clone the group elements.
                if (!this.aFreeSearchGroups[iIndex][2] || this.aFreeSearchGroups[iIndex][2] == "") this.aFreeSearchGroups[iIndex][2] = "chrome://websearchpro/skin/websearchpro_toolbar_free_favourites.png"; //Default icon...
                if (bFavIconWasEmpty && this.aFreeSearchGroups[iIndex][2] != "") bConvertedFavIcon = true;

                oItem = document.getElementById('ct-group-wspro-' + this.aFreeSearchGroups[iIndex][0]);

                sFavIconURI = this.aFreeSearchGroups[iIndex][2];
                if (sFavIconURI.indexOf("data:image") < 0 && sFavIconURI.indexOf("chrome://") < 0)
                {
                    sFavIconURI = WSProOverlay.oUtils.RemoteImage2B64(sFavIconURI, document.getElementById('wspro-faviconcanvas'));
                    if (sFavIconURI && sFavIconURI != "") {
                        this.aFreeSearchGroups[iIndex][2] = sFavIconURI;
                        bConvertedFavIcon = true;
                    }
                }

                if (!oItem) {
                    if (oPopupCT) {
                        //Content Style=Group
                        if (document.getElementById('ct-group-wspro-' + this.aFreeSearchGroups[iIndex][0])) continue;
                        oItem = document.getElementById('ct-group-wspro-clone').cloneNode(true);
                        oPopupCT.insertBefore(oItem, oItemBeforeCT);

                        oItem.setAttribute('id', 'ct-group-wspro-' + this.aFreeSearchGroups[iIndex][0]);
                        oItem.setAttribute('label', this.aFreeSearchGroups[iIndex][1]);
                        oItem.setAttribute('tooltiptext', this.aFreeSearchGroups[iIndex][1]);
                        var p1 = 'ct-group-wspro-' + this.aFreeSearchGroups[iIndex][0];
                        var p2 = this.aFreeSearchGroups[iIndex][2];
                        oItem.addEventListener('command', function(event) {
                            WSProOverlay.WSProHandleContextGroupClick(event, p1, p2);
                        }, false);
                        oItem.setAttribute('fseicon', this.aFreeSearchGroups[iIndex][2]);
                        oItem.setAttribute('style', "background-image: url('" + this.aFreeSearchGroups[iIndex][2] + "'); list-style-image: url('" + this.aFreeSearchGroups[iIndex][2] + "');");

                        //Content Style=List
                        if (document.getElementById('ct-vlist-wspro-' + this.aFreeSearchGroups[iIndex][0])) continue;
                        oItem = document.getElementById('ct-vlist-wspro-clone').cloneNode(true);
                        oPopupCT.insertBefore(oItem, oItemBeforeCT);

                        oItem.setAttribute('id', 'ct-vlist-wspro-' + this.aFreeSearchGroups[iIndex][0]);
                        oItem.setAttribute('tooltiptext', this.aFreeSearchGroups[iIndex][1]);
                        p1 = 'ct-vlist-wspro-' + this.aFreeSearchGroups[iIndex][0];
                        p2 = this.aFreeSearchGroups[iIndex][2];
                        oItem.addEventListener('command', function(event) {
                            WSProOverlay.WSProHandleContextGroupClick(event, p1, p2);
                        }, false);
                        oItem.setAttribute('fseicon', this.aFreeSearchGroups[iIndex][2]);
                        oItem.setAttribute('style', "background-image: url('" + this.aFreeSearchGroups[iIndex][2] + "'); list-style-image: url('" + this.aFreeSearchGroups[iIndex][2] + "');");
                        oItem.childNodes[0].setAttribute('src', this.aFreeSearchGroups[iIndex][2]);
                        oItem.childNodes[1].setAttribute('value', this.aFreeSearchGroups[iIndex][1]);
                    }
                }

                oItem = document.getElementById('tb-group-wspro-' + this.aFreeSearchGroups[iIndex][0]);
                if (!oItem) {
                    if (oPopupTB) {
                        //Toolbar Style=Group
                        if (document.getElementById('tb-group-wspro-' + this.aFreeSearchGroups[iIndex][0])) continue;
                        oItem = document.getElementById('tb-group-wspro-clone').cloneNode(true);
                        oPopupTB.insertBefore(oItem, oItemBeforeTB);

                        oItem.setAttribute('id', 'tb-group-wspro-' + this.aFreeSearchGroups[iIndex][0]);
                        var p1 = 'tb-group-wspro-' + this.aFreeSearchGroups[iIndex][0];
                        oItem.addEventListener('command', function(event) {
                            WSProOverlay.WSProHandleToolbarGroupClick(event, p1);
                        }, false);
                        oItem.setAttribute('label', this.aFreeSearchGroups[iIndex][1]);
                        oItem.setAttribute('tooltiptext', this.aFreeSearchGroups[iIndex][1]);
                        oItem.setAttribute('fseicon', this.aFreeSearchGroups[iIndex][2]);
                        oItem.setAttribute('style', "background-image: url('" + this.aFreeSearchGroups[iIndex][2] + "'); list-style-image: url('" + this.aFreeSearchGroups[iIndex][2] + "');");

                        //Toolbar Style=List
                        if (document.getElementById('tb-vlist-wspro-' + this.aFreeSearchGroups[iIndex][0])) continue;
                        oItem = document.getElementById('tb-vlist-wspro-clone').cloneNode(true);
                        oPopupTB.insertBefore(oItem, oItemBeforeTB);

                        oItem.setAttribute('id', 'tb-vlist-wspro-' + this.aFreeSearchGroups[iIndex][0]);
                        oItem.setAttribute('tooltiptext', this.aFreeSearchGroups[iIndex][1]);
                        var p1 = 'tb-vlist-wspro-' + this.aFreeSearchGroups[iIndex][0];
                        oItem.addEventListener('command', function(event) {
                            WSProOverlay.WSProHandleToolbarGroupClick(event, p1);
                        }, false);
                        oItem.setAttribute('fseicon', this.aFreeSearchGroups[iIndex][2]);
                        oItem.setAttribute('style', "background-image: url('" + this.aFreeSearchGroups[iIndex][2] + "'); list-style-image: url('" + this.aFreeSearchGroups[iIndex][2] + "');");
                        oItem.childNodes[0].setAttribute('src', this.aFreeSearchGroups[iIndex][2]);
                        oItem.childNodes[1].setAttribute('value', this.aFreeSearchGroups[iIndex][1]);
                    }
                }
            }
        }
        if (bConvertedFavIcon) {
            WSProOverlay.oUtils.SetLocalizedString("mmsearch-freesearchgroups", WSProOverlay.oUtils.WSProFlattenFreeSearchGroups(this.aFreeSearchGroups));
        }
    },

    MMSearchInitFreeSearchEngines: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("MMSearchInitFreeSearchEngines");
        //Initialize the free search engines array
        this.aFreeSearchEngines = null;
        this.aFreeSearchEngines = new Array();

        var oPopupTB, oPopupCT, oItems, oItem, oItemBeforeTB, oItemBeforeCT, oTypeElement, oNextTypeElement, oImg;
        var aTemp = new Array();
        var iItemIndex, iGroupIndex;
        var sMenuStyle = WSProOverlay.oUtils.GetString("mmsearch-menustyle");
        var sFavIconURI = "";
        var oPH = Components.classes["@mozilla.org/network/protocol;1?name=file"].createInstance(Components.interfaces.nsIFileProtocolHandler);
        var oFile, oURI;
        var bConvertedFavIcon = false;

        aTemp = WSProOverlay.oUtils.GetLocalizedString("mmsearch-freesearchengines").split('f_e');
        var iIndex, iLen = aTemp.length;

        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (aTemp[iIndex] != "") {
                this.aFreeSearchEngines[iIndex] = new Array();
                this.aFreeSearchEngines[iIndex] = aTemp[iIndex].split('f_v');
                if (this.aFreeSearchEngines[iIndex].length == 6) {
                    //A bug in version 2.6 caused the b64 favicon to be split up into 2 parts.
                    this.aFreeSearchEngines[iIndex][4] = this.aFreeSearchEngines[iIndex][4] + "," + this.aFreeSearchEngines[iIndex][5];
                    this.aFreeSearchEngines[iIndex].splice(5, 1);
                    bConvertedFavIcon = true;
                }
            }
        }

        oPopupTB = document.getElementById('mmsearchpopupsearchengine');
        oItemBeforeTB = document.getElementById('mspopupbeforeoptions');
        oPopupCT = document.getElementById('mmsearchcontextsearchengines');
        oItemBeforeCT = document.getElementById('mscontextbeforeoptions');

        if ((!oPopupTB && !oPopupCT) || !WSProOverlay.oUtils) return setTimeout(function () {WSProOverlay.MMSearchInitFreeSearchEngines();}, 200);

        //Remove all current fse menuitems from context and toolbar.
        WSProOverlay.oUtils.RemoveAllChildren(document.getElementById('mmsearchcontextsearchengines'), 'ct-group-wspro-clone,ct-vlist-wspro-clone,clone-mmsearch-searchfreesearch,mscontextbeforeoptions,mmsearch-options');
        if (document.getElementById('mmsearchpopupsearchengine')) WSProOverlay.oUtils.RemoveAllChildren(document.getElementById('mmsearchpopupsearchengine'), 'tb-group-wspro-clone,tb-vlist-wspro-clone,clone-mmsearch-searchfreesearch-toolbar,mspopupbeforeoptions,mmsearch-options-toolbar');

        //Initialize the Free Search Engine Groups.
        WSProOverlay.WSProInitFreeSearchEngineGroups();

        oItems = document.getElementsByAttribute('menustyler', 'true');
        iLen = oItems.length;
        for (iIndex = 0; iIndex < iLen; iIndex++) {
            oItems[iIndex].setAttribute('hidden', 'true');
        }

        //Add all currently selected fse menuitems from context and toolbar.
        iLen = this.aFreeSearchEngines.length;
        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (this.aFreeSearchEngines[iIndex][4] != '') {
                if (this.aFreeSearchEngines[iIndex][4].length == 3) sFavIconURI = WSProOverlay.oUtils.GetFaviconURI(this.aFreeSearchEngines[iIndex][2], this.aFreeSearchEngines[iIndex][4]);
                else sFavIconURI = this.aFreeSearchEngines[iIndex][4];

                this.aFreeSearchEngines[iIndex][4] = sFavIconURI;
            }

            if (oPopupCT) {
                if (document.getElementById('ct_fse_' + this.aFreeSearchEngines[iIndex][0])) continue;
                oItem = document.getElementById('clone-mmsearch-searchfreesearch').cloneNode(true);
                oItem.setAttribute('id', 'ct_fse_' + this.aFreeSearchEngines[iIndex][0]);
                oItem.setAttribute('fsemenu', "context");
                oItem.setAttribute('fseid', this.aFreeSearchEngines[iIndex][0]);
                oItem.setAttribute('fselabel', this.aFreeSearchEngines[iIndex][1]);
                oItem.setAttribute('tooltiptext', this.aFreeSearchEngines[iIndex][1]);
                oItem.setAttribute('fseurl', this.aFreeSearchEngines[iIndex][2]);
                oItem.setAttribute('fsetype', this.aFreeSearchEngines[iIndex][3]);
                oItem.setAttribute('fseicon', this.aFreeSearchEngines[iIndex][4]);

                if (this.aFreeSearchEngines[iIndex][4] != '') {
                    oItem.childNodes[0].setAttribute('src', sFavIconURI);
                }
                oItem.style.backgroundImage = "none";

                oItem.setAttribute('hidden', false);
                if (sMenuStyle == "flat") {
                    oPopupCT.insertBefore(oItem, oItemBeforeCT);
                    oItem.style.paddingLeft = "6px";
                }

                if (sMenuStyle == "group") {
                    oTypeElement = document.getElementById('ct-group-wspro-' + this.aFreeSearchEngines[iIndex][3]);
                    oTypeElement.setAttribute('hidden', false);
                    oTypeElement.firstChild.appendChild(oItem);
                    oItem.style.paddingLeft = "6px";
                }

                if (sMenuStyle == "list") {
                    oItem.style.paddingLeft = "29px";

                    oTypeElement = document.getElementById('ct-vlist-wspro-' + this.aFreeSearchEngines[iIndex][3]);
                    oTypeElement.setAttribute('hidden', false);
                    oTypeElement.setAttribute('style', 'padding-left: 7px');
                    oNextTypeElement = WSProOverlay.GetNextMenuStyler('ct-vlist-wspro-' + this.aFreeSearchEngines[iIndex][3])
                    if (!oNextTypeElement) oNextTypeElement = document.getElementById('clone-mmsearch-searchfreesearch');
                    oPopupCT.insertBefore(oItem, oNextTypeElement);
                }
            }
            if (oPopupTB) {
                if (document.getElementById('tb_fse_' + this.aFreeSearchEngines[iIndex][0])) continue;
                oItem = document.getElementById('clone-mmsearch-searchfreesearch-toolbar').cloneNode(true);
                oItem.setAttribute('id', 'tb_fse_' + this.aFreeSearchEngines[iIndex][0]);
                oItem.setAttribute('fsemenu', "toolbar");
                oItem.setAttribute('label', this.aFreeSearchEngines[iIndex][1]);
                oItem.childNodes[1].setAttribute('value', this.aFreeSearchEngines[iIndex][1]);
                oItem.setAttribute('tooltiptext', this.aFreeSearchEngines[iIndex][1]);
                oItem.setAttribute('fseid', this.aFreeSearchEngines[iIndex][0]);
                oItem.setAttribute('fseurl', this.aFreeSearchEngines[iIndex][2]);
                oItem.setAttribute('fsetype', this.aFreeSearchEngines[iIndex][3]);
                oItem.setAttribute('fseicon', this.aFreeSearchEngines[iIndex][4]);

                if (this.aFreeSearchEngines[iIndex][4] != '') {
                    oItem.childNodes[0].setAttribute('src', sFavIconURI);
                }
                oItem.style.backgroundImage = "none";
                oItem.setAttribute('hidden', false);
                if (sMenuStyle == "flat") {
                    oPopupTB.insertBefore(oItem, oItemBeforeTB);
                    oItem.style.paddingLeft = "7px";
                }

                if (sMenuStyle == "group") {
                    oTypeElement = document.getElementById('tb-group-wspro-' + this.aFreeSearchEngines[iIndex][3]);
                    oTypeElement.setAttribute('hidden', false);
                    oTypeElement.firstChild.appendChild(oItem);
                    oItem.style.paddingLeft = "7px";
                }

                if (sMenuStyle == "list") {
                    oItem.style.paddingLeft = "29px";

                    oTypeElement = document.getElementById('tb-vlist-wspro-' + this.aFreeSearchEngines[iIndex][3]);
                    oTypeElement.setAttribute('hidden', false);
                    oTypeElement.setAttribute('style', 'padding-left: 7px');
                    oNextTypeElement = WSProOverlay.GetNextMenuStyler('tb-vlist-wspro-' + this.aFreeSearchEngines[iIndex][3])
                    if (!oNextTypeElement) oNextTypeElement = document.getElementById('clone-mmsearch-searchfreesearch-toolbar');
                    oPopupTB.insertBefore(oItem, oNextTypeElement);
                }
            }
        }

        if (bConvertedFavIcon) {
            WSProOverlay.oUtils.SetLocalizedString("mmsearch-freesearchengines", WSProOverlay.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
        }

        return true;
    },

    WSProGetFSEIDIndex: function (sFSEID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProGetFSEIDIndex('" + sFSEID + "')");
        var iIndex, iLen = this.aFreeSearchEngines.length;
        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (this.aFreeSearchEngines[iIndex][0] == sFSEID) return iIndex;
        }
        return -1;
    },

    WSProGetGroupIndex: function (sGroupID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProGetGroupIndex('" + sGroupID + "')");
        var iIndex, iLen = this.aFreeSearchGroups.length;
        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (this.aFreeSearchGroups[iIndex][0] == sGroupID) return iIndex;
        }
        return -1;
    },

    WSProGetShortcutIndex: function (sFSEID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProGetShortcutIndex('" + sFSEID + "')");
        var iIndex, iLen = this.aKeyboardShortcuts.length;
        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (this.aKeyboardShortcuts[iIndex][1] == sFSEID) return iIndex;
        }
        return -1;
    },

    WSProGetDropZoneXIndex: function (sFSEID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProGetDropZoneXIndex('" + sFSEID + "')");
        var iX, iY;

        for (iX = 0; iX < 8; iX++) {
            for (iY = 0; iY < 8; iY++) {
                if (this.aDropZones[iX][iY] && this.aDropZones[iX][iY][0] == sFSEID) return iX;
            }
        }
        return -1;
    },

    WSProGetDropZoneYIndex: function (sFSEID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProGetDropZoneYIndex('" + sFSEID + "')");
        var iX, iY;

        for (iX = 0; iX < 8; iX++) {
            for (iY = 0; iY < 8; iY++) {
                if (this.aDropZones[iX][iY] && this.aDropZones[iX][iY][0] == sFSEID) return iY;
            }
        }
        return -1;
    },

    WSProFlattenShortcuts: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProFlattenShortcuts");
        var aTemp = new Array();
        var sResult = "";
        var iIndex, iLen = this.aKeyboardShortcuts.length;
        for (iIndex = 0; iIndex < iLen; iIndex++) {
            aTemp[iIndex] = this.aKeyboardShortcuts[iIndex].join('s_v');
        }
        sResult = aTemp.join('s_k');

        return sResult;
    },

    WSProFlattenDropZones: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProFlattenDropZones");
        var aTemp = new Array();
        var sResult = "";
        var iX, iY;

        for (iX = 0; iX < 8; iX++) {
            for (iY = 0; iY < 8; iY++) {
                if (this.aDropZones[iX][iY] && this.aDropZones[iX][iY][4]) sResult += iX + "d_v" + iY + "d_v" + this.aDropZones[iX][iY][0] + "d_z";
            }
        }
        return sResult;
    },

    WSProInitShortcuts: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProInitShortcuts");
        //Init Keyboard shotrcuts array.
        this.aKeyboardShortcuts = null;
        this.aKeyboardShortcuts = new Array();

        var aTemp = new Array();
        var oKey;
        aTemp = WSProOverlay.oUtils.GetLocalizedString("mmsearch-shortcutkeys").split('s_k');
        var iIndex, iLen = aTemp.length;

        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (aTemp[iIndex] != "") {
                this.aKeyboardShortcuts[iIndex] = new Array();
                this.aKeyboardShortcuts[iIndex] = aTemp[iIndex].split('s_v');

                if (this.aKeyboardShortcuts[iIndex].length == 2) {
                    //Pre 2.2, add S or A for SHIFT or ALT.
                    this.aKeyboardShortcuts[iIndex][2] = "S";
                }

                //Enable this key.
                if (this.aKeyboardShortcuts[iIndex][2] == "S") {
                    oKey = document.getElementById('wspro-key-' + this.aKeyboardShortcuts[iIndex][0]);
                } else {
                    oKey = document.getElementById('wspro-key-alt-' + this.aKeyboardShortcuts[iIndex][0]);
                }
                oKey.setAttribute('fseid', 'tb_fse_' + this.aKeyboardShortcuts[iIndex][1]);
                oKey.setAttribute('disabled', 'false');
            }
        }
    },

    WSProInitDropZones: function (dDontFillEmptyZones) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProInitDropZones('" + dDontFillEmptyZones + "')");
        this.iDropZoneMaxAxis = 4;
        this.aDropZones = null;
        this.aDropZones = new Array(8);
        this.aDropZones[0] = new Array(8);
        this.aDropZones[1] = new Array(8);
        this.aDropZones[2] = new Array(8);
        this.aDropZones[3] = new Array(8);
        this.aDropZones[4] = new Array(8);
        this.aDropZones[5] = new Array(8);
        this.aDropZones[6] = new Array(8);
        this.aDropZones[7] = new Array(8);

        var oCT;
        var aTempZones = new Array();
        var aTempZone = new Array();
        var sFSEID, sLabel, sFavIcon;
        var iFSEIndex, iX, iY;

        aTempZones = WSProOverlay.oUtils.GetLocalizedString("mmsearch-dropzones").split('d_z');
        var iIndex, iLen = aTempZones.length;

        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (aTempZones[iIndex] != "") {
                aTempZone = aTempZones[iIndex].split('d_v');
                if (aTempZone[0] >= 4 || aTempZone[1] >= 4) {
                    if (this.iDropZoneMaxAxis < 6) this.iDropZoneMaxAxis = 6;
                }
                if (aTempZone[0] >= 7 || aTempZone[1] >= 7) {
                    if (this.iDropZoneMaxAxis < 8) this.iDropZoneMaxAxis = 8;
                }

                iFSEIndex = WSProOverlay.WSProGetFSEIDIndex(aTempZone[2]);
                if (iFSEIndex >= 0) {
                    sFSEID = this.aFreeSearchEngines[iFSEIndex][0];
                    sLabel = this.aFreeSearchEngines[iFSEIndex][1];
                    sFavIcon = this.aFreeSearchEngines[iFSEIndex][4];

                    if (sFavIcon == "") {
                        if (this.aFreeSearchEngines[iFSEIndex][3] == "movie") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_movie.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "music") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_music.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "other") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "compu") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_computer.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "educa") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_education.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "newss") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_news.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "refer") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_reference.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "shopp") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_shopping.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "busin") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_business.png";
                        else {
                            /*No favicon, and custom group*/
                            iGroupIndex = WSProOverlay.WSProGetGroupIndex(this.aFreeSearchEngines[iFSEIndex][3]);
                            if (iGroupIndex >= 0) sFavIcon = this.aFreeSearchGroups[iGroupIndex][2];
                            else sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";
                        }
                    }

                    this.aDropZones[parseInt(aTempZone[0])][parseInt(aTempZone[1])] = new Array(sFSEID, sLabel, sFavIcon, null, true);
                } else {
                    oCT = document.getElementById('ct-vlist-wspro-' + aTempZone[2]);
                    if (oCT) {
                        sFavIcon = oCT.firstChild.src;
                        this.aDropZones[parseInt(aTempZone[0])][parseInt(aTempZone[1])] = new Array(aTempZone[2], oCT.childNodes[1].value, sFavIcon, null, true);
                    }
                }
            }
        }

        //Fill empty dropzone(s).
        for (iX = 0; iX < 8; iX++) {
            for (iY = 0; iY < 8; iY++) {
                if (!this.aDropZones[iX][iY]) this.aDropZones[iX][iY] = new Array('', '', '', null, false);
            }
        }

        //And assign the current engine to the empty one(s).
        if (!dDontFillEmptyZones) WSProOverlay.WSProAssignCurrentFSEToDropZones(WSProOverlay.oUtils.GetString("mmsearch-preferedsearchengine"));
    },

    WSProAssignCurrentFSEToDropZones: function (sFSEID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProAssignCurrentFSEToDropZones('" + sFSEID + "')");
        if (WSProOverlay.oUtils.GetBool("mmsearch-showunassigneddropzones")) {
            if (this.aDropZones) {
                var oCT;
                var sFSEID, sLabel, sFavIcon;
                var iFSEIndex, iX, iY;

                sFSEID = sFSEID.replace('ct_fse_', '');
                sFSEID = sFSEID.replace('tb_fse_', '');
                iFSEIndex = WSProOverlay.WSProGetFSEIDIndex(sFSEID);
                if (iFSEIndex >= 0) {
                    sFSEID = this.aFreeSearchEngines[iFSEIndex][0];
                    sLabel = this.aFreeSearchEngines[iFSEIndex][1];
                    sFavIcon = this.aFreeSearchEngines[iFSEIndex][4];

                    if (sFavIcon == "") {
                        if (this.aFreeSearchEngines[iFSEIndex][3] == "movie") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_movie.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "music") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_music.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "other") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "compu") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_computer.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "educa") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_education.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "newss") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_news.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "refer") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_reference.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "shopp") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_shopping.png";
                        else if (this.aFreeSearchEngines[iFSEIndex][3] == "busin") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_business.png";
                        else {
                            /*No favicon, and custom group*/
                            iGroupIndex = WSProOverlay.WSProGetGroupIndex(this.aFreeSearchEngines[iFSEIndex][3]);
                            if (iGroupIndex >= 0) sFavIcon = this.aFreeSearchGroups[iGroupIndex][2];
                            else sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";
                        }
                    }
                } else {
                    sFSEID = sFSEID.replace('ct_fse_', '');
                    sFSEID = sFSEID.replace('tb_fse_', '');
                    oCT = document.getElementById(sFSEID);
                    if (!oCT) oCT = document.getElementById(sFSEID.replace('tb-', 'ct-'));
                    if (!oCT) oCT = document.getElementById('ct_fse_' + sFSEID);
                    if (!oCT.childNodes[1] || !oCT.childNodes[1].nodeName == "image") {
                        oCT = document.getElementById(sFSEID.replace('-group-', '-vlist-'));
                    }
                    if (oCT) {
                        sLabel = oCT.childNodes[1].value;
                        sFavIcon = oCT.firstChild.src;
                    }
                }
                if (sFavIcon && sFavIcon != "") {
                    //Fill all empty dropzones with info about the current.
                    for (iX = 0; iX < 8; iX++) {
                        for (iY = 0; iY < 8; iY++) {
                            if (this.aDropZones[iX][iY][4] == false) {
                                this.aDropZones[iX][iY][0] = sFSEID;
                                this.aDropZones[iX][iY][1] = sLabel;
                                this.aDropZones[iX][iY][2] = sFavIcon;
                            }
                        }
                    }
                }
            }
        }
    },

    WSProCheckDZStillDragging: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProCheckDZStillDragging");
        if (this.iStillDragging && this.iStillDragging <= 0) {
            WSProOverlay.WSProUpdateDropZones('destroy');
            return 0;
        }
        this.iStillDragging--;
        return setTimeout(function () {WSProOverlay.WSProCheckDZStillDragging();}, 500);
    },

    WSProUpdateDropZones: function (sStatus, iMouseX, iMouseY) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProUpdateDropZones('" + sStatus + "', '" + iMouseX + "', '" + iMouseY + "')");
        this.iStillDragging = 1;
        var iWidth, iHeight, iTop, iLeft, iDZWidth, iDZHeight, iX, iY, iHighlightX, iHighlightY;
        var oRoot = WSProOverlay.GetLargestRootElement();

        iWidth = oRoot.clientWidth - 10;
        iHeight = oRoot.clientHeight - 10;
        iLeft = oRoot.scrollLeft;
        iTop = oRoot.scrollTop;

        iDZWidth = Math.floor(iWidth / this.iDropZoneMaxAxis);
        iDZHeight = Math.floor(iHeight / this.iDropZoneMaxAxis);

        if (sStatus == 'highlight') {
            iHighlightX = Math.floor(iMouseX / iDZWidth);
            if (iHighlightX < 0) iHighlightX = 0;
            if (iHighlightX > this.iDropZoneMaxAxis - 1) iHighlightX = this.iDropZoneMaxAxis - 1;
            iHighlightY = Math.floor(iMouseY / iDZHeight);
            if (iHighlightY < 0) iHighlightY = 0;
            if (iHighlightY > this.iDropZoneMaxAxis - 1) iHighlightY = this.iDropZoneMaxAxis - 1;

            if (this.iLastHighlightedDropZoneX != iHighlightX || this.iLastHighlightedDropZoneY != iHighlightY) {
                if (this.iLastHighlightedDropZoneX > -1 && this.iLastHighlightedDropZoneY > -1) {
                    var iIndex = this.aFadeOutDropZones.length;
                    if (this.aDropZones[this.iLastHighlightedDropZoneX][this.iLastHighlightedDropZoneY][3]) this.aDropZones[this.iLastHighlightedDropZoneX][this.iLastHighlightedDropZoneY][3].setAttribute('highlight', false);
                    this.aFadeOutDropZones[iIndex] = new Array(0, this.aDropZones[this.iLastHighlightedDropZoneX][this.iLastHighlightedDropZoneY][3]);
                }
                this.iLastHighlightedDropZoneX = iHighlightX;
                this.iLastHighlightedDropZoneY = iHighlightY;
            }

            if (this.aDropZones[iHighlightX][iHighlightY][3]) this.aDropZones[iHighlightX][iHighlightY][3].UpdateStatus(sStatus);
        } else {
            for (iX = 0; iX < this.iDropZoneMaxAxis; iX++) {
                for (iY = 0; iY < this.iDropZoneMaxAxis; iY++) {
                    if (this.aDropZones[iX][iY][0]) {
                        if (sStatus == 'show') {
                            this.aDropZones[iX][iY][3] = WSProOverlay.WSProGetDropZoneUI('dz_' + iX + '_' + iY, oRoot);
                            this.aDropZones[iX][iY][3].SetProperties((iX * iDZWidth + 5 + iLeft), (iY * iDZHeight + 5 + iTop), iDZWidth, iDZHeight, this.aDropZones[iX][iY][1], this.aDropZones[iX][iY][2]);
                        }
                        if (this.aDropZones[iX][iY][3]) this.aDropZones[iX][iY][3].UpdateStatus(sStatus);
                        if (sStatus == 'destroy') {
                            this.aDropZones[iX][iY][3] = null;
                            //WSProOverlay.RemoveDropZoneFromRoot(oRoot, 'dz_' + iX + '_' + iY); //Perhaps not so necessary anymore...
                        }
                    }
                }
            }
            if (sStatus == 'destroy') {
                this.aFadeOutDropZones = null;
                this.aFadeOutDropZones = new Array();
                this.iLastHighlightedDropZoneX = -1;
                this.iLastHighlightedDropZoneY = -1;

                WSProOverlay.SetDragInitialized(false);
                WSProOverlay.SetDragUseDropZones(0);
            }
        }
        if (this.aFadeOutDropZones) WSProOverlay.WSProDropZoneFadeOut();
    },

    WSProDragDropDZSearch: function (sText, iMouseX, iMouseY, sTargetID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProUpdateDropZones('" + sText + "', '" + iMouseX + "', '" + iMouseY + "', '" + sTargetID + "')");
        if (sTargetID != "MMSearchTBTextbox" && !WSProOverlay.GetDragInitialized()) return false;

        var iWidth, iHeight, iDZWidth, iDZHeight, iHighlightX, iHighlightY;
        var oRoot = WSProOverlay.GetLargestRootElement();

        iWidth = oRoot.clientWidth - 10;
        iHeight = oRoot.clientHeight - 10;
        iDZWidth = Math.floor(iWidth / this.iDropZoneMaxAxis);
        iDZHeight = Math.floor(iHeight / this.iDropZoneMaxAxis);

        iHighlightX = Math.floor(iMouseX / iDZWidth);
        if (iHighlightX < 0) iHighlightX = 0;
        if (iHighlightX > this.iDropZoneMaxAxis) iHighlightX = this.iDropZoneMaxAxis;
        iHighlightY = Math.floor(iMouseY / iDZHeight);
        if (iHighlightY < 0) iHighlightY = 0;
        if (iHighlightY > this.iDropZoneMaxAxis) iHighlightY = this.iDropZoneMaxAxis;

        if ((!this.aDropZones[iHighlightX][iHighlightY][3] || this.aDropZones[iHighlightX][iHighlightY][3].getAttribute('highlight') != 'true') && sTargetID != "MMSearchTBTextbox") return false;
        var sSearchEngine = this.aDropZones[iHighlightX][iHighlightY][0];
        var oItem = document.getElementById('ct_fse_' + sSearchEngine);
        if (!oItem) {
            oItem = document.getElementById('ct-vlist-wspro-' + sSearchEngine);
            if (oItem) sSearchEngine = 'ct-vlist-wspro-' + sSearchEngine;
        }
        if (!oItem || sTargetID == "MMSearchTBTextbox") sSearchEngine = WSProOverlay.oUtils.GetString("mmsearch-preferedsearchengine");
        sSearchEngine = sSearchEngine.replace('ct-', 'tb-');
        sSearchEngine = sSearchEngine.replace('ct_', 'tb_');

        var oTextBox = document.getElementById("MMSearchTBTextbox");
        if (oTextBox) oTextBox.value = "";

        var bSearched = WSProOverlay.SetSearchEngine(sSearchEngine, false, false, null, true);
        if (!bSearched) WSProOverlay.MMSearchDragDropSearch(sSearchEngine, sText);

        return true;
    },

    WSProCheckDZHandlesThisDrag: function (oEvent) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProCheckDZHandlesThisDrag('" + oEvent.shiftKey + "')");
        if (oEvent.shiftKey) return false;
        return true;
    },

    WSProCheckDZHandlesThisDrop: function (oEvent) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProCheckDZHandlesThisDrop('" + oEvent.target.id + "')");
        var sTargetID = oEvent.target.id;
        if (sTargetID != "MMSearchTBTextbox" && !WSProOverlay.GetDragInitialized()) return false;

        var iWidth, iHeight, iDZWidth, iDZHeight, iHighlightX, iHighlightY, iMouseX, iMouseY;
        var oRoot = WSProOverlay.GetLargestRootElement();

        iMouseX = oEvent.clientX;
        iMouseY = oEvent.clientY;

        iWidth = oRoot.clientWidth - 10;
        iHeight = oRoot.clientHeight - 10;
        iDZWidth = Math.floor(iWidth / this.iDropZoneMaxAxis);
        iDZHeight = Math.floor(iHeight / this.iDropZoneMaxAxis);

        iHighlightX = Math.floor(iMouseX / iDZWidth);
        if (iHighlightX < 0) iHighlightX = 0;
        if (iHighlightX > this.iDropZoneMaxAxis) iHighlightX = this.iDropZoneMaxAxis;
        iHighlightY = Math.floor(iMouseY / iDZHeight);
        if (iHighlightY < 0) iHighlightY = 0;
        if (iHighlightY > this.iDropZoneMaxAxis) iHighlightY = this.iDropZoneMaxAxis;

        if (!this.aDropZones[iHighlightX][iHighlightY][3] || this.aDropZones[iHighlightX][iHighlightY][3].getAttribute('highlight') != 'true') return false;

        return true;
    },

    WSProStoreMousePos: function (oEvent) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProCheckDZHandlesThisDrop");
        var iWidth, iHeight, iMouseX, iMouseY;
        var oRoot = WSProOverlay.GetLargestRootElement();

        iWidth = oRoot.clientWidth;
        iHeight = oRoot.clientHeight;
        iMouseX = oEvent.clientX;
        iMouseY = oEvent.clientY;

        if (iMouseX >= 0 && iMouseX <= iWidth && iMouseY >= 0 && iMouseY <= iHeight) {
            this.iLastKnownMouseXPos = iMouseX;
            this.iLastKnownMouseYPos = iMouseY;
        }
    },

    WSProCheckDropZonesExit: function (oEvent) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProCheckDropZonesExit");
        var iWidth, iHeight, iMouseX, iMouseY;
        var oRoot = WSProOverlay.GetLargestRootElement();

        iWidth = oRoot.clientWidth;
        iHeight = oRoot.clientHeight;
        iMouseX = oEvent.clientX;
        iMouseY = oEvent.clientY;

        if (iMouseX > 0 && iMouseX < iWidth && iMouseY > 0 && iMouseY < iHeight) {
            return false;
        }

        if (iMouseX != -100 || iMouseY != -100) {
            if (this.iLastKnownMouseXPos && this.iLastKnownMouseYPos) {
                if (this.iLastKnownMouseXPos > 15 && this.iLastKnownMouseXPos < iWidth - 15 && this.iLastKnownMouseYPos > 15 && this.iLastKnownMouseYPos < iHeight - 15) {
                    return false;
                }
            }
        }
        WSProOverlay.WSProUpdateDropZones('destroy');
        return true;
    },

    WSProDropZoneFadeOut: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProDropZoneFadeOut");
        var iIndex, iLen = this.aFadeOutDropZones.length;
        var iFadeTime = 2;
        var bSplice;
        var sStyle = WSProOverlay.oUtils.GetString("mmsearch-dropzonetrailstyle");

        for (iIndex = iLen - 1; iIndex > -1; iIndex--) {
            if (sStyle == "none") {
                bSplice = true;
                if (this.aFadeOutDropZones[iIndex][1]) {
                    if (this.aFadeOutDropZones[iIndex][1].getAttribute('highlight') == 'false') {
                        this.aFadeOutDropZones[iIndex][1].Header.style.MozOpacity = 0.8;
                        this.aFadeOutDropZones[iIndex][1].Content.style.MozOpacity = 0.4;
                    }
                }
            } else {
                bSplice = false;
                if (sStyle == "once") iFadeTime = 12;
                this.aFadeOutDropZones[iIndex][0]++;
                if (this.aFadeOutDropZones[iIndex][0] == iFadeTime) {
                    this.aFadeOutDropZones[iIndex][0] = 0;
                    if (this.aFadeOutDropZones[iIndex][1]) {
                        if (this.aFadeOutDropZones[iIndex][1].getAttribute('highlight') == 'false') {
                            var iOpacity = this.aFadeOutDropZones[iIndex][1].Content.style.MozOpacity - 0.07;
                            if (sStyle == "once") iOpacity = 0.4;
                            this.aFadeOutDropZones[iIndex][1].Content.style.MozOpacity = iOpacity;
                            if (iOpacity <= 0.4) {
                                this.aFadeOutDropZones[iIndex][1].Header.style.MozOpacity = 0.8;
                                this.aFadeOutDropZones[iIndex][1].Content.style.MozOpacity = 0.4;
                                bSplice = true;
                            }
                        } else {
                            bSplice = true;
                        }
                    }
                }
            }
            if (bSplice) this.aFadeOutDropZones.splice(iIndex, 1);
        }
    },

    WSProGetDropZoneUI: function (sID, oRoot) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProGetDropZoneUI('" + sID + "')");
        var DropZone = getBrowser().contentDocument.getElementById(sID);
        if (!DropZone) {
            var sColor = WSProOverlay.oUtils.GetString("mmsearch-dropzonecolor");
            var sTColor = WSProOverlay.oUtils.GetContrastTextColor(sColor);

            DropZone = getBrowser().contentDocument.createElement("div");
            DropZone.id = sID;
            DropZone.className = 'dropzone';
            DropZone.Root = oRoot;
            DropZone.setAttribute('pack', 'start');
            DropZone.setAttribute('style', 'background: transparent; color: ' + sTColor + ' !important; border: 1px solid rgb(124,124,124); position: absolute; font: 8pt verdana; font-weight: bold; z-index: 999');
            DropZoneHeader = getBrowser().contentDocument.createElement("div");
            DropZoneHeader.setAttribute('style', 'opacity: 0.8; color: ' + sTColor + ' !important; background-color: ' + sColor + ';');
            DropZoneContent = getBrowser().contentDocument.createElement("div");
            DropZoneContent.setAttribute('style', 'opacity: 0.4; color: ' + sTColor + ' !important; background-color: ' + sColor + ';');

            DropZoneImage = getBrowser().contentDocument.createElement("img");
            DropZoneImage.setAttribute('style', 'margin-top: 3px; vertical-align: text-bottom; padding-left: 3px; padding-right: 3px; max-height: 16px; max-width: 16px; border: none;');
            DropZoneLabel = getBrowser().contentDocument.createElement("span");
            DropZoneLabel.setAttribute('style', 'display: inline;');

            DropZoneHeader.appendChild(DropZoneImage);
            DropZoneHeader.appendChild(DropZoneLabel);

            DropZone.appendChild(DropZoneHeader);
            DropZone.appendChild(DropZoneContent);

            DropZone.Header = DropZoneHeader;
            DropZone.Image = DropZoneImage;
            DropZone.Label = DropZoneLabel;
            DropZone.Content = DropZoneContent;
            DropZone.UpdateStatus = function (sStatus) {
                switch (sStatus) {
                case "create":
                    this.Header.style.MozOpacity = 0.8;
                    this.Content.style.MozOpacity = 0.4;
                    this.style.display = "none";
                    this.setAttribute('highlight', false);
                    break;
                case "show":
                    this.Header.style.MozOpacity = 0.8;
                    this.Content.style.MozOpacity = 0.4;
                    this.style.display = "block";
                    this.setAttribute('highlight', false);
                    break;
                case "destroy":
                    DropZone.Root.removeChild(this);
                    break;
                case "highlight":
                    this.Header.style.MozOpacity = 0.9;
                    this.Content.style.MozOpacity = 0.9;
                    this.setAttribute('highlight', true);
                    break;
                }
            }
            DropZone.SetProperties = function (X, Y, Width, Height, sLabel, sImage) {
                this.style.left = X + "px";
                this.style.top = Y + "px";
                this.style.minWidth = Width + "px";
                this.style.minHeight = Height + "px";
                this.Header.style.minWidth = Width + "px";
                this.Header.style.minHeight = "25px";
                this.Content.style.minWidth = Width + "px";
                this.Content.style.minHeight = (Height - 25) + "px";
                this.Content.style.top = (Y + 25) + "px";
                if (Width <= 97) {
                    if (sLabel.length > 11) sLabel = sLabel.substr(0, 8) + "...";
                } //Res 800 DZ 64
                else if (Width <= 125) {
                    if (sLabel.length > 14) sLabel = sLabel.substr(0, 11) + "...";
                } //Res 1024 DZ 64
                else if (Width <= 158) {
                    if (sLabel.length > 19) sLabel = sLabel.substr(0, 16) + "...";
                } //Res 1280 DZ 64
                else if (Width <= 225) {
                    if (sLabel.length > 22) sLabel = sLabel.substr(0, 19) + "...";
                } //Res 800 DZ 16
                else if (Width <= 275) {
                    if (sLabel.length > 32) sLabel = sLabel.substr(0, 29) + "...";
                } //Res 1024 DZ 16
                else {
                    if (sLabel.length > 42) sLabel = sLabel.substr(0, 39) + "...";
                } //Res 1280 DZ 16
                this.Label.appendChild(getBrowser().contentDocument.createTextNode(sLabel));
                this.Image.setAttribute('src', sImage);
            }
            DropZone.style.display = "none";
            DropZone.Root.appendChild(DropZone);
        }
        return DropZone;
    },

    RemoveDropZoneFromRoot: function (oRoot, sID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.RemoveDropZoneFromRoot('" + sID + "')");
        var oBrowser = getBrowser();

        var oDropZone = oBrowser.contentDocument.getElementById(sID);
        if (oDropZone && oRoot) oRoot.removeChild(oDropZone);
    },

    GetDragInitialized: function () {
        return this.bDragInitialized;
    },
    
    SetDragInitialized: function (bValue) {
        this.bDragInitialized = bValue;
    },
    
    GetDragUseDropZones: function () {
        return this.iDragUseDropZones;
    },
    
    SetDragUseDropZones: function (iValue) {
        this.iDragUseDropZones = iValue;
    },

    GetLargestRootElement: function (oBrowser) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("GetLargestRootElement");
        if (!oBrowser) oBrowser = getBrowser();
        var iMaxHeight = document.height;
        var oResult;
        var oRoot = oBrowser.contentDocument.getElementsByTagName('frameset')[0];
        if (!oRoot) {
            if (oBrowser.contentDocument.body && (oBrowser.contentDocument.body.scrollTop > 0 || (oBrowser.contentDocument.body.clientHeight != oBrowser.contentDocument.body.offsetHeight && oBrowser.contentDocument.body.clientHeight <= iMaxHeight))) {
                oResult = oBrowser.contentDocument.body;
            } else {
                oResult = oBrowser.contentDocument.documentElement;
            }
        } else {
            var oFrames = oRoot.getElementsByTagName('frame');
            var iIndex, iLen = oFrames.length;
            var iWidth = 0,
                iHeight = 0;

            for (iIndex = 0; iIndex < iLen; iIndex++) {
                if (oFrames[iIndex].contentDocument.body.scrollTop > 0 || oFrames[iIndex].contentDocument.body.clientHeight != oFrames[iIndex].contentDocument.body.offsetHeight) {
                    oRoot = oFrames[iIndex].contentDocument.body;
                } else {
                    oRoot = oFrames[iIndex].contentDocument.documentElement;
                }
                if (oRoot && (oRoot.clientWidth * oRoot.clientHeight) >= (iWidth * iHeight)) {
                    iWidth = oRoot.clientWidth;
                    iHeight = oRoot.clientHeight;
                    oResult = oRoot;
                }
            }
        }
        return oResult;
    },

    MMSearchAddToolbar: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("MMSearchAddToolbar");
        //Check if the user wants to automaticly add the toolbar button.
        var oNavBar = document.getElementById("nav-bar");
        if (oNavBar.currentSet) {
            var bCheck = WSProOverlay.oUtils.GetBool("mmsearch-checkaddtoolbarbutton") && (!document.getElementById('MMSearchToolbarContainer') || !document.getElementById('MMSearchTBQTSButton'));

            if (bCheck) {
                var sNewSet = oNavBar.currentSet + ",MMSearchToolbarContainer,MMSearchTBQTSButton";
                oNavBar.currentSet = sNewSet;
                oNavBar.setAttribute("currentset", sNewSet);
                document.persist("nav-bar", "currentset");
                try {
                    BrowserToolboxCustomizeDone(true);
                } catch(e) {}

                bCheck = false; //Only try it once...
                if (!WSProOverlay.oUtils) WSProOverlay.oUtils = new MMSearchUtils();
                WSProOverlay.oUtils.SetBool("mmsearch-checkaddtoolbarbutton", bCheck);
            }
        }
    },

    PopupMMSearch: function (oEvent) {
        if (oEvent && oEvent.target.id != "contentAreaContextMenu") return;
        if (!WSProOverlay.oUtils) WSProOverlay.oUtils = new MMSearchUtils();
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("PopupMMSearch");

        if (WSProOverlay.oUtils.GetBool("mmsearch-hidewsprocontext") == false) {
            //Occurs when the context menu is opened. Hide if no text is selected, otherwise show selected text.
            document.getElementById('contentAreaContextMenu').setAttribute("wspro_isvisible", "true");
            if (!gContextMenu) gContextMenu = new nsContextMenu(document.getElementById('contentAreaContextMenu'));
            WSProOverlay.WSProStoreSelectedText("");
            var oMenuItem = document.getElementById("mmsearch-context");

            var sSelectedText = WSProOverlay.MMSearchGetSelectedText();
            if (sSelectedText && sSelectedText != "") {
                WSProOverlay.WSProStoreSelectedText(sSelectedText);
                if (sSelectedText.length > 15) {
                    sSelectedText = sSelectedText.substr(0, 15) + "...";
                }
                oMenuItem.hidden = false;
                oMenuItem.setAttribute("label", WSProOverlay.oUtils.TranslateString("mmsearch-wspro-searchfreesearch", sSelectedText));
                WSProOverlay.SetPopupMenuItemPropertiesFree(sSelectedText);
            } else {
                //Hide main menuitem
                oMenuItem.hidden = true;
            }
        } else {
            WSProOverlay.WSProHideItems();
        }
        if (WSProOverlay.oUtils.GetBool("mmsearch-hidedefaultws") == true) {
            //Hide Default Firefox Web Search.
            var oElement;
            oElement = document.getElementById('context-searchselect');
            if (oElement) oElement.setAttribute('hidden', 'true');
        }
        //Check if we should display the suggest menuitem
        gContextMenu.showItem("wspro-context-suggest", (gContextMenu.onTextInput || gContextMenu.onKeywordField) && gContextMenu.target.name != "" && !gContextMenu.target.disabled);
        gContextMenu.showItem("wspro-context-suggest_private", (gContextMenu.onTextInput || gContextMenu.onKeywordField) && gContextMenu.target.name != "" && !gContextMenu.target.disabled);
    },

    WSProContextMenuHidden: function () {
        document.getElementById('contentAreaContextMenu').setAttribute("wspro_isvisible", "false");
    },

    WSProStoreSelectedText: function (sSelectedText) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProStoreSelectedText('" + sSelectedText + "')");
        this.sCurrentSearchText = sSelectedText;
    },

    SetPopupMenuItemPropertiesFree: function (sText) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.SetPopupMenuItemPropertiesFree('" + sText + "')");
        var oItems = document.getElementsByAttribute('fsemenu', 'context');
        var sLabel, sName;
        var iIndex, iLen = oItems.length;
        for (iIndex = 0; iIndex < iLen; iIndex++) {
            sName = oItems[iIndex].getAttribute('fselabel');
            sLabel = sName; //WSProOverlay.oUtils.TranslateString("mmsearch-searchfreesearch", sName, sText);
            oItems[iIndex].setAttribute('label', sLabel);
            oItems[iIndex].childNodes[1].setAttribute('value', sLabel);
        }
    },

    MMSearchInitToolbar: function (bInitFSE) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.MMSearchInitToolbar('" + bInitFSE + "')");
        if (this.bWSProDisableInstantApply) WSProOverlay.WSProEnableInstantApply(true);
        if (bInitFSE == true) WSProOverlay.MMSearchInitFreeSearchEngines();

        var oToolbar = document.getElementById("MMSearchToolbarContainer");
        if (oToolbar && !oToolbar.parentNode.parentNode.collapsed && !(window.getComputedStyle(oToolbar.parentNode, null).display == "none")) {
            var oMenuItem = null;
            var sTooltip = "";
            var sFSEType = "";
            var sFSEURI = "";
            var sFSEIcon = "";
            var oPH = Components.classes["@mozilla.org/network/protocol;1?name=file"].createInstance(Components.interfaces.nsIFileProtocolHandler);
            var oFile, oURI;
            var bIsGroupIcon = false;

            //Check for prefered search engine.
            var sSearchEngine = WSProOverlay.oUtils.GetString("mmsearch-preferedsearchengine");
            oMenuItem = document.getElementById(sSearchEngine);

            var iIndex, iLen;
            var bFound = false;

            if (sSearchEngine.length == 20) //Group/List item
            {
                iIndex = 0;
                sTooltip = oMenuItem.getAttribute('tooltiptext');
                sFSEType = oMenuItem.getAttribute('fsetype');
                sFSEURI = "";
                sFSEIcon = "";

                if (!oMenuItem || oMenuItem.hidden == true) {
                    //Check the first non hidden item.
                    sSearchEngine = 'tb_fse_' + this.aFreeSearchEngines[0][0];
                    oMenuItem = document.getElementById(sSearchEngine);
                    if (oMenuItem) {
                        oMenuItem.setAttribute("checked", "true");
                        sTooltip = oMenuItem.getAttribute('label');
                    }
                    //Store this one, cause the other is not visible...
                    WSProOverlay.oUtils.SetString("mmsearch-preferedsearchengine", sSearchEngine);
                    sFSEType = oMenuItem.getAttribute('fsetype');
                    //Update the dropzones.
                    WSProOverlay.WSProAssignCurrentFSEToDropZones(sSearchEngine);
                }
                if (oMenuItem.getAttribute('fseicon') && oMenuItem.getAttribute('fseicon') != "") {
                    sFSEIcon = oMenuItem.getAttribute('fseicon');
                    bIsGroupIcon = true;
                }
            }
            else {
                //Get the index of sSearchEngine in the FreeSearchEngines array.
                iLen = this.aFreeSearchEngines.length;
                for (iIndex = 0; iIndex < iLen; iIndex++) {
                    if ('tb_fse_' + this.aFreeSearchEngines[iIndex][0] == sSearchEngine) {
                        bFound = true;
                        break;
                    }
                }
                if (bFound == false) {
                    iIndex = 0;
                    oMenuItem = null;
                }

                if (oMenuItem && oMenuItem.hidden == false) {
                    oMenuItem.setAttribute("checked", "true");
                    sTooltip = oMenuItem.getAttribute('label');
                    sFSEType = oMenuItem.getAttribute('fsetype');
                    sFSEURI = oMenuItem.getAttribute('fseurl');
                    sFSEIcon = oMenuItem.getAttribute('fseicon');
                } else {
                    //Check the first non hidden item.
                    sSearchEngine = 'tb_fse_' + this.aFreeSearchEngines[0][0]
                    oMenuItem = document.getElementById(sSearchEngine);
                    if (oMenuItem) {
                        oMenuItem.setAttribute("checked", "true");
                        sTooltip = oMenuItem.getAttribute('label');
                    }
                    //Store this one, cause the other is not visible...
                    WSProOverlay.oUtils.SetString("mmsearch-preferedsearchengine", sSearchEngine);
                    sFSEType = this.aFreeSearchEngines[0][3];
                    sFSEURI = this.aFreeSearchEngines[0][2];
                    sFSEIcon = this.aFreeSearchEngines[0][4];
                    //Update the dropzones.
                    WSProOverlay.WSProAssignCurrentFSEToDropZones(sSearchEngine);
                }
            }

            //Change the icon.
            var MMSearchTextBox = document.getElementById("MMSearchTBButton");
            document.getElementById('mmsearchenginetooltip').firstChild.setAttribute('value', sTooltip);

            MMSearchTextBox.setAttribute("class", "mmsearch_freesearch");
            MMSearchTextBox.setAttribute('style', "");
            MMSearchTextBox.setAttribute("fsetype", sFSEType);
            if (sFSEIcon != "") {
                var sFavIconURI = "";
                sFavIconURI = sFSEIcon;

                MMSearchTextBox.setAttribute('style', "list-style-image: url('" + sFavIconURI + "'); background-image: url('" + sFavIconURI + "')");
            }
            //Optionally change the autocompletesearch attribute
            MMSearchTextBox = document.getElementById("MMSearchTBTextbox");
            if (WSProOverlay.oUtils.GetBool("mmsearch-googlesuggest") && ("nsIBrowserSearchService" in Components.interfaces)) {
                MMSearchTextBox.setAttribute('autocompletesearch', 'wspro-remote-url-suggestions');
            } else {
                MMSearchTextBox.setAttribute('autocompletesearch', 'form-history');
            }

            MMSearchTextBox.mSearchNames = null;
            MMSearchTextBox.mController.input = null;
            MMSearchTextBox.mController.input = MMSearchTextBox;
        }
        WSProOverlay.ProcessToolbarFocus(false);
    },

    WSProConvertFavIconsToB64: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProConvertFavIconsToB64()");
        var aTemp = WSProOverlay.oUtils.GetLocalizedString("mmsearch-freesearchengines").split('f_e');
        var aTemp2 = new Array();
        var oTmpImage;
        var sFavIconURI;
        var iIndex, iLen = aTemp.length;

        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (aTemp[iIndex] != "") {
                aTemp2[iIndex] = new Array();
                aTemp2[iIndex] = aTemp[iIndex].split('f_v');
                if (aTemp2[iIndex][4] && aTemp2[iIndex][4] != "" && aTemp2[iIndex][4].indexOf("data:image") < 0) {
                    if (aTemp2[iIndex][4].length == 3) sFavIconURI = WSProOverlay.oUtils.GetFaviconURI(aTemp2[iIndex][2], aTemp2[iIndex][4]);
                    else sFavIconURI = aTemp2[iIndex][4];
                    oTmpImage = new Image();
                    oTmpImage.src = sFavIconURI;
                    oTmpImage.setAttribute('fseid', aTemp2[iIndex][0]);
                    oTmpImage.onload = function () {
                        try {
                            document.defaultView.WSProOverlay.WSProConvertFavIconToB64(this.getAttribute('fseid'));
                        }
                        catch(e) {}
                    }
                } else if (!aTemp2[iIndex][4] || aTemp2[iIndex][4] == "") {
                    document.defaultView.WSProOverlay.WSProConvertFavIconToB64(aTemp2[iIndex][0]);
                }
            }
        }
    },

    WSProConvertFavIconToB64: function (sFSEID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProConvertFavIconToB64('" + sFSEID + "')");
        var sFavIconURI;
        var iIndex, iLen = this.aFreeSearchEngines.length;
        var iGroupIndex;

        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (this.aFreeSearchEngines[iIndex][0] == sFSEID) {
                if (this.aFreeSearchEngines[iIndex][4] != '') {
                    if (this.aFreeSearchEngines[iIndex][4].length == 3) sFavIconURI = WSProOverlay.oUtils.GetFaviconURI(this.aFreeSearchEngines[iIndex][2], this.aFreeSearchEngines[iIndex][4]);
                    else sFavIconURI = this.aFreeSearchEngines[iIndex][4];

                    if (sFavIconURI.indexOf("data:image") < 0) {
                        sFavIconURI = WSProOverlay.oUtils.RemoteImage2B64(sFavIconURI, document.getElementById('wspro-faviconcanvas'));

                        if (sFavIconURI && sFavIconURI != "") {
                            this.aFreeSearchEngines[iIndex][4] = sFavIconURI;
                            WSProOverlay.oUtils.SetLocalizedString("mmsearch-freesearchengines", WSProOverlay.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
                        }
                    }
                } else {
                    /*No favicon, and custom group*/
                    iGroupIndex = WSProOverlay.WSProGetGroupIndex(this.aFreeSearchEngines[iIndex][3]);
                    if (iGroupIndex >= 0) this.aFreeSearchEngines[iIndex][4] = this.aFreeSearchGroups[iGroupIndex][2];
                    else this.aFreeSearchEngines[iIndex][4] = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";
                    WSProOverlay.oUtils.SetLocalizedString("mmsearch-freesearchengines", WSProOverlay.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
                }
            }
        }
    },

    WSProSuggestSearchEngine: function (oFormitem, bPrivate) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProSuggestSearchEngine('" + oFormitem.ownerDocument.location.href + "')");
        //Code idea from Search Engine Wizard by Milx.
        var oForm = oFormitem.form;
        var oURI;
        var sLabel = oFormitem.ownerDocument.title;
        var sURI = oFormitem.ownerDocument.location.href;
        var sFavIcon = WSProOverlay.oUtils.GetFavIconFromTab(sURI);
        var sParams = "?",
            sUserParam = "";
        var sValue = "",
            sEncoding = "";
        var iIndex, iLen, iOIndex, iOLen, iButtons = 0;

        if (oForm) {
            sEncoding = oForm.ownerDocument.inputEncoding;
            if (this.sWSProDefaultEncoding != sEncoding) {
                sParams = "?wsproencoding=" + sEncoding + "%26"
            }

            if (oForm.action == "") oForm.action = "/";
            try {
                oURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(oForm.action, null, null);
            }
            catch(e) {
                oURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(sURI, null, null).resolve(oForm.action);
            }

            if (oURI.spec.indexOf("#") >= 0) oURI.spec = oURI.spec.substring(0, oURI.spec.indexOf("#"));

            iLen = oForm.elements.length;
            for (iIndex = 0; iIndex < iLen; iIndex++) {
                if (!oForm.elements[iIndex]) {continue;}
                
                //if (oForm.elements[iIndex].isSameNode(oFormitem)) {
                if (oForm.elements[iIndex] == oFormitem) {
                    sUserParam = encodeURIComponent(oFormitem.name) + "=";
                } else {
                    if (!oForm.elements[iIndex].name || oForm.elements[iIndex].name == "" || oForm.elements[iIndex].disabled || oForm.elements[iIndex].name == "undefined" || oForm.elements[iIndex].name.toUpperCase().indexOf("VIEWSTATE") >= 0) continue;

                    switch (oForm.elements[iIndex].type) {
                    case "button":
                    case "reset":
                        break;
                    case "radio":
                        if (oForm.elements[iIndex].checked) sParams += encodeURIComponent(oForm.elements[iIndex].name) + "=" + encodeURIComponent(oForm.elements[iIndex].value) + "%26";
                        break;
                    case "checkbox":
                        {
                            if (oForm.elements[iIndex].checked) {
                                if (oForm.elements[iIndex].value && oForm.elements[iIndex].value != "") {
                                    sParams += encodeURIComponent(oForm.elements[iIndex].name) + "=" + encodeURIComponent(oForm.elements[iIndex].value) + "%26";
                                } else {
                                    sParams += encodeURIComponent(oForm.elements[iIndex].name) + "=true%26";
                                }
                            }
                            break;
                        }
                    case 'select-multiple':
                        {
                            iOLen = oForm.elements[iIndex].options.length;
                            for (iOIndex = 0; iOIndex < iOLen; iOIndex++) {
                                sValue = oForm.elements[iIndex].options[iOIndex].value;
                                if (sValue != "" && oForm.elements[iIndex].options[iOIndex].selected) sParams += encodeURIComponent(oForm.elements[iIndex].name) + "=" + encodeURIComponent(oForm.elements[iIndex].options[iOIndex].value) + "%26";
                            }
                            break;
                        }
                    case "submit":
                        {
                            if (iButtons > 0) break;
                            iButtons++;
                        }
                    case "text":
                    case "":
                    case "textarea":
                    case "hidden":
                    case "password":
                    case "file":
                    case "select-one":
                    default:
                        {
                            if (oForm.elements[iIndex] instanceof HTMLSelectElement && oForm.elements[iIndex].selectedIndex >= 0) {
                                iOLen = oForm.elements[iIndex].options.length;
                                for (iOIndex = 0; iOIndex < iOLen; iOIndex++) {
                                    if (oForm.elements[iIndex].options[iOIndex].selected) {
                                        sValue = oForm.elements[iIndex].options[iOIndex].value;
                                        if (sValue != "") sParams += encodeURIComponent(oForm.elements[iIndex].name) + "=" + encodeURIComponent(sValue) + "%26";
                                    }
                                }
                            } else {
                                sValue = oForm.elements[iIndex].value;
                                if (sValue != "" && sValue.length < 200) sParams += encodeURIComponent(oForm.elements[iIndex].name) + "=" + encodeURIComponent(oForm.elements[iIndex].value) + "%26";
                            }
                        }
                    }
                }
            }
            sURI = oURI.spec + sParams + sUserParam;
            if (!sURI || sURI == "") sURI = oURI.spec;
        }

        if (!sURI || sURI == "") sURI = content.document.location.href;
        if (oForm && oForm.method && oForm.method == "post") sURI = sURI.replace('://', 'post://');
        if (!sLabel || sLabel == "") sLabel = content.document.title;
        if (!sFavIcon || sFavIcon == "") sFavIcon = "none";
        if (bPrivate) {
            var sID = 'p' + (parseInt(WSProOverlay.oUtils.GetString("mmsearch-privatefseid").replace('p', ''), 10) + 1);
            WSProOverlay.oUtils.SetString("mmsearch-privatefseid", sID);

            if (sFavIcon == "none") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";
            var aSearchEngine = new Array(sID, sLabel, sURI, 'other', sFavIcon);
            this.aFreeSearchEngines.splice(0, 0, aSearchEngine);
            WSProOverlay.oUtils.SetLocalizedString("mmsearch-freesearchengines", WSProOverlay.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));

            window.openDialog("chrome://websearchpro/content/websearchprosearchengine.xul", "", "centerscreen,chrome,modal,resizable", "edit", 0);
        } else window.openDialog("chrome://websearchpro/content/websearchprosearchengine.xul", "", "centerscreen,chrome,modal,resizable", "suggest", sLabel, sURI, sFavIcon);
    },

    OpenOptions: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("OpenOptions");
        //Display the options screen.
        if (this.bWSProDisableInstantApply) WSProOverlay.WSProEnableInstantApply(false);
        window.openDialog("chrome://websearchpro/content/websearchprosettings.xul", "wspro-settings", "chrome,titlebar,toolbar,centerscreen,resizable", this);
    },

    WSProSearchEngineListener: function (e) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProSearchEngineListener");
        var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
        var oItem;
        var sLabel, sType = "Invalid type!",
            sSource;

        sLabel = e.target.getAttribute("fselabel");
        oItem = document.getElementById("ct-group-wspro-" + e.target.getAttribute("fsetype"));
        if (oItem) sType = oItem.getAttribute('label');
        sSource = WSProOverlay.oUtils.GetDomainFromURI(content.location.href);
        var bConfirm = promptService.confirm(window, WSProOverlay.oUtils.TranslateString('mmsearch-webaddengine-msg-title'), WSProOverlay.oUtils.TranslateString('mmsearch-webaddengine-msg-question', sLabel, sType, sSource));
        if (bConfirm) {
            WSProOverlay.WSProSelectFreeSearchEngine(e.target.getAttribute("fseid"), e.target.getAttribute("fselabel"), e.target.getAttribute("fseurl"), e.target.getAttribute("fsefavicon"), e.target.getAttribute("fsetype"));
        }
    },

    WSProFFSearchEngineListener: function (sAction, oEngine) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProFFSearchEngineListener('" + sAction + "', '" + oEngine.wrappedJSObject._file + "')");
        if (WSProOverlay.oUtils) {
            if (oEngine.wrappedJSObject._file) {
                if (sAction == "engine-added") {
                    //Prevent duplicates since this observer appears to be notified a lot.
                    var aFFIDs = WSProOverlay.oUtils.WSProGetLinkedFFSEArray();
                    var iFSEIDIndex = WSProOverlay.oUtils.WSProGetLinkedFFSEIndex(aFFIDs, oEngine.wrappedJSObject._id)
                    var sFSEID = "";
                    if (iFSEIDIndex >= 0) sFSEID = aFFIDs[iFSEIDIndex][1];
                    if (!sFSEID || sFSEID == "") {
                        var aNotLinkedFFEngines = WSProOverlay.oUtils.WSProGetNotLinkedFFSEArray();
                        var iIndex = WSProOverlay.oUtils.WSProGetNotLinkedFFSEIndex(aNotLinkedFFEngines, oEngine.wrappedJSObject._id);

                        if (iIndex >= 0) return;

                        this.sWSProAddingSearchEngineID = oEngine.wrappedJSObject._id;
                        var aWSProEngine = WSProOverlay.oUtils.WSProFFSearchEngine2WSPro(oEngine);

                        if (aWSProEngine.length != 5) return;

                        if (WSProOverlay.WSProSelectFreeSearchEngine(aWSProEngine[0], aWSProEngine[1], aWSProEngine[2], aWSProEngine[4], aWSProEngine[3], true)) {
                            var sFFSELinks = WSProOverlay.oUtils.GetString("mmsearch-linkedffsearchengines");
                            sFFSELinks += "l_e" + oEngine.wrappedJSObject._id + "l_v" + aWSProEngine[0];
                            WSProOverlay.oUtils.SetString("mmsearch-linkedffsearchengines", sFFSELinks);

                            WSProOverlay.MMSearchInitToolbar(true);
                            WSProOverlay.WSProInitShortcuts();
                            WSProOverlay.WSProInitDropZones();

                            var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
                            oObService.notifyObservers(this, "new-searchengine", "OK");

                            this.sWSProAddingSearchEngineID = "";
                        }
                    }
                }
                if (sAction == "engine-changed") {
                    if (!this.sWSProAddingSearchEngineID || this.sWSProAddingSearchEngineID == "") {
                        var aFFIDs = WSProOverlay.oUtils.WSProGetLinkedFFSEArray();
                        var iFSEIDIndex = WSProOverlay.oUtils.WSProGetLinkedFFSEIndex(aFFIDs, oEngine.wrappedJSObject._id)
                        if (iFSEIDIndex == -1) return;
                        var sFSEID = aFFIDs[iFSEIDIndex][1];
                        if (sFSEID && sFSEID != "") {
                            iIndex = WSProOverlay.WSProGetFSEIDIndex(sFSEID);
                            if (iIndex == -1) return;
                            var aWSProEngine = WSProOverlay.oUtils.WSProFFSearchEngine2WSPro(oEngine, true);
                            if (aWSProEngine.length != 5) return;
                            if (this.aFreeSearchEngines[iIndex][1] != aWSProEngine[1] || this.aFreeSearchEngines[iIndex][2] != aWSProEngine[2] || this.aFreeSearchEngines[iIndex][3] != aWSProEngine[3] || this.aFreeSearchEngines[iIndex][4] != aWSProEngine[4]) {
                                this.aFreeSearchEngines[iIndex][1] = aWSProEngine[1];
                                this.aFreeSearchEngines[iIndex][2] = aWSProEngine[2];
                                //this.aFreeSearchEngines[iIndex][3] = aWSProEngine[3]; Don't update FF Search Engine types.
                                this.aFreeSearchEngines[iIndex][4] = aWSProEngine[4];
                                WSProOverlay.oUtils.SetLocalizedString("mmsearch-freesearchengines", WSProOverlay.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));

                                WSProOverlay.MMSearchInitToolbar(true);
                                WSProOverlay.WSProInitShortcuts();
                                WSProOverlay.WSProInitDropZones();
                            }
                        }
                    }
                }
                if (sAction == "engine-current") {
                    var aFFIDs = WSProOverlay.oUtils.WSProGetLinkedFFSEArray();
                    var iFSEIDIndex = WSProOverlay.oUtils.WSProGetLinkedFFSEIndex(aFFIDs, oEngine.wrappedJSObject._id)
                    if (iFSEIDIndex == -1) return;
                    var sFSEID = aFFIDs[iFSEIDIndex][1];
                    if (sFSEID && sFSEID != "") {
                        iIndex = WSProOverlay.WSProGetFSEIDIndex(sFSEID);
                        if (iIndex == -1) return;
                        WSProOverlay.SetSearchEngine(sFSEID, false, true);
                        var oTB = document.getElementById('MMSearchTBTextbox');
                        if (oTB) oTB.focus();
                    }
                }
            }
        }
    },

    WSProCheckOpenSearchLinks: function () {
        if (document.defaultView.WSProOverlay.oUtils) {
            var oSBP = document.getElementById('sbp-wspro-addengine');
            oSBP.setAttribute('hidden', 'true');
            if (!document.defaultView.WSProOverlay.oUtils.GetBool("mmsearch-hidewsprostatusbar")) {
                const searchRelRegex = /(^|\s)search($|\s)/i;
                const searchHrefRegex = /^(https?|ftp):\/\//i;

                var oSBPTT = document.getElementById('sbp-wspro-addengine-tooltip');
                var aLinks = getBrowser().contentDocument.getElementsByTagName('LINK');
                var oLink;
                var sType;
                var iIndex, iLen = aLinks.length;

                for (iIndex = 0; iIndex < iLen; iIndex++) {
                    oLink = aLinks[iIndex];
                    sType = oLink.type;

                    if (!sType) return;
                    if (!oSBP) return;

                    if (sType == "application/opensearchdescription+xml" && searchRelRegex.test(oLink.rel) && searchHrefRegex.test(oLink.href) && oLink.title) {
                        oSBPTT.setAttribute('label', document.defaultView.WSProOverlay.oUtils.TranslateString("wspro-autoaddengine-tooltip", oLink.title));
                        oSBP.setAttribute('fsetitle', oLink.title);
                        oSBP.setAttribute('fsehref', oLink.href);
                        var sLink = oLink.href;
                        oSBP.addEventListener('click', function() {
                            WSProOverlay.WSProAddOpenSearchEngine(sLink);
                        }, false);
                        oSBP.setAttribute('hidden', 'false');
                    }
                }
            }
        }
    },

    WSProAddOpenSearchEngine: function (sXMLURI) {
        if ((typeof window.external == "object") && (typeof window.external.AddSearchProvider == "function")) {
            window.external.AddSearchProvider(sXMLURI);
        }
    },

    WSProSelectFreeSearchEngine: function (sID, sLabel, sURI, sFavicon, sType, bDontReload) {
        //sURI = sURI.replace(/\{searchTerms%20/g, "{searchTerms ");
        sURI = sURI.replace(/%20/g, " ");
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProSelectFreeSearchEngine('" + sID + "', '" + sLabel + "', '" + sURI + "', '" + sFavicon + "', '" + sType + "', '" + bDontReload + "')");
        var oSE = document.getElementById('ct_fse_' + sID);
        if (!oSE) {
            if (sFavicon.length == 3) sFavicon = WSProOverlay.oUtils.GetFaviconURI(sURI, sFavicon);
            if (sFavicon.indexOf("data:image") < 0 && sFavicon.indexOf("chrome://") < 0) {
                sFavicon = WSProOverlay.oUtils.RemoteImage2B64(sFavicon, document.getElementById('wspro-faviconcanvas'));
            }
            var aSearchEngine = new Array(sID, sLabel, sURI, sType, sFavicon);
            this.aFreeSearchEngines.splice(0, 0, aSearchEngine);
            if (WSProOverlay.oUtils.GetBool("mmsearch-autosort")) {
                var sOrder = WSProOverlay.oUtils.GetString("mmsearch-autosortorder");
                if (sOrder == "ASC") this.aFreeSearchEngines.sort(WSProOverlay.oUtils.WSProArrayCompareAsc);
                if (sOrder == "DESC") this.aFreeSearchEngines.sort(WSProOverlay.oUtils.WSProArrayCompareDesc);
            }
            WSProOverlay.oUtils.SetLocalizedString("mmsearch-freesearchengines", WSProOverlay.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));

            if (!bDontReload) {
                var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
                oObService.notifyObservers(this, "apply-settings", "OK");
                oObService.notifyObservers(this, "new-searchengine", "OK");
            }
            return true;
        }
        return false;
    },

    WSProEditActiveSE: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProEditActiveSE()");
        var sFSEID = WSProOverlay.oUtils.GetString("mmsearch-preferedsearchengine");
        sFSEID = sFSEID.replace('tb_fse_', '');
        WSProOverlay.WSProEditSearchEngine(null, sFSEID);
    },

    WSProEditSearchEngine: function (event, sFSEID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProEditSearchEngine('" + sFSEID + "')");
        if (!sFSEID) sFSEID = document.popupNode.getAttribute('fseid');
        if (!sFSEID) sFSEID = this.oContextPopupNode.getAttribute('fseid');

        WSProOverlay.WSProHidePopups();
        var iIndex = WSProOverlay.WSProGetFSEIDIndex(sFSEID);

        if (iIndex == -1) return;
        window.openDialog("chrome://websearchpro/content/websearchprosearchengine.xul", "", "centerscreen,chrome,modal,resizable", "edit", iIndex);
    },

    WSProRemoveSearchEngine: function (event, sFSEID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProRemoveSearchEngine('" + sFSEID + "')");
        if (!sFSEID) sFSEID = document.popupNode.getAttribute('fseid');
        if (!sFSEID) sFSEID = this.oContextPopupNode.getAttribute('fseid');
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProRemoveSearchEngine('" + sFSEID + "')");

        WSProOverlay.WSProHidePopups();
        var iIndex = WSProOverlay.WSProGetFSEIDIndex(sFSEID);
        var iX, iY;

        if (iIndex == -1) return;
        this.aFreeSearchEngines.splice(iIndex, 1);
        WSProOverlay.oUtils.SetLocalizedString("mmsearch-freesearchengines", WSProOverlay.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));

        //Check if there's also a shortcut to remove.
        iIndex = WSProOverlay.WSProGetShortcutIndex(sFSEID);
        if (iIndex >= 0) this.aKeyboardShortcuts.splice(iIndex, 1);
        WSProOverlay.oUtils.SetLocalizedString("mmsearch-shortcutkeys", WSProOverlay.WSProFlattenShortcuts());
        //Check if there's also a dropzone to remove.
        WSProOverlay.WSProInitDropZones(true);
        iX = WSProOverlay.WSProGetDropZoneXIndex(sFSEID);
        iY = WSProOverlay.WSProGetDropZoneYIndex(sFSEID);
        while(iX >= 0 && iY >= 0) {
            this.aDropZones[iX].splice(iY, 1);
            iX = WSProOverlay.WSProGetDropZoneXIndex(sFSEID);
            iY = WSProOverlay.WSProGetDropZoneYIndex(sFSEID);
        }
        WSProOverlay.oUtils.SetLocalizedString("mmsearch-dropzones", WSProOverlay.WSProFlattenDropZones());
        //Remove the FF search engine file.
        sFSEID = sFSEID.replace('ct_fse_', '');
        sFSEID = sFSEID.replace('tb_fse_', '');

        if (sFSEID.substr(0, 1) == "f") {
            var aFFIDs = WSProOverlay.oUtils.WSProGetLinkedFFSEArray();
            var iFSEIDIndex = WSProOverlay.oUtils.WSProGetLinkedFFSEIndex(aFFIDs, "", sFSEID);
            if (iFSEIDIndex >= 0) {
                var sFFID = aFFIDs[iFSEIDIndex][0];
                var oSS = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);
                var oEngines = oSS.getEngines({});
                var iFFIndex, iFFLen = oEngines.length;
                var bFound = false;
                for (iFFIndex = 0; iFFIndex < iFFLen; iFFIndex++) {
                    if (sFFID == oEngines[iFFIndex].wrappedJSObject._id) {
                        sFFID = oEngines[iFFIndex].wrappedJSObject._id; //Will be gone after the delete...
                        try {
                            oSS.removeEngine(oEngines[iFFIndex]);
                        }
                        catch(e) {}
                        bFound = true;
                        break;
                    }
                }
                if (!bFound) {
                    oSS = Components.classes["@mozilla.org/browser/search-service;1"].createInstance(Components.interfaces.nsIBrowserSearchService);
                    for (iFFIndex = 0; iFFIndex < iFFLen; iFFIndex++) {
                        if (sFFID == oEngines[iFFIndex].wrappedJSObject._id) {
                            sFFID = oEngines[iFFIndex].wrappedJSObject._id; //Will be gone after the delete...
                            try {
                                oSS.removeEngine(oEngines[iFFIndex]);
                            }
                            catch(e) {}
                            bFound = true;
                            break;
                        }
                    }
                }
                if (!bFound) {
                    //Mark it to not link again.
                    WSProOverlay.oUtils.SetString("mmsearch-notlinkedffsearchengines", WSProOverlay.oUtils.GetString("mmsearch-notlinkedffsearchengines") + "l_e" + sFFID);
                }

            }
        }

        //Remove the linked FF Search Engine.
        WSProOverlay.oUtils.WSProRemoveLinkedFFSE(sFSEID);
        if (WSProOverlay.oUtils.GetString('mmsearch-defaultse') == sFSEID) WSProOverlay.oUtils.SetString('mmsearch-defaultse', 'recentfseid')

        var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        oObService.notifyObservers(this, "apply-settings", "OK");
    },

    //Search from toolbar.
    SetSearchEngine: function (sSearchEngine, bFromMenu, bForceSwitchEngine, oEvent, bDoNotSearch) {
        sSearchEngine = sSearchEngine.replace("tb_fse_tb-", "tb-");

        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.SetSearchEngine('" + sSearchEngine + "', " + bFromMenu + ", " + bForceSwitchEngine + ", " + oEvent + ", " + bDoNotSearch + ")");
        if (oEvent) {
            oEvent.stopPropagation();
        }

        var oTB = document.getElementById('MMSearchTBTextbox');
        var bClearTBValue = false;
        var bSearched = false;

        //Clear the text if we got focus, and the current tb value is the same as the SE tooltip.
        if (oTB) {
            var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
            if (oTB.value == sTT && oTB.getAttribute('hasfocus') == "false") {
                oTB.value = "";
                bClearTBValue = true;
            }
        }

        //Change the default search engine.
        if (!document.getElementById(sSearchEngine)) sSearchEngine = "tb_fse_" + sSearchEngine;
        var bIsSwitch = sSearchEngine != WSProOverlay.oUtils.GetString("mmsearch-preferedsearchengine");
        if (WSProOverlay.oUtils.GetString("mmsearch-defaultse") != "" || bFromMenu || bForceSwitchEngine) WSProOverlay.oUtils.SetString("mmsearch-preferedsearchengine", sSearchEngine);
        //Reload toolbar.
        WSProOverlay.MMSearchInitToolbar(false);

        if (WSProOverlay.oUtils.GetBool("mmsearch-searchonengineswitch") && bIsSwitch) {
            //Start search if there's already text.
            if (oTB) {
                if (bClearTBValue) oTB.value = "";

                var sTBSearch = oTB.value;
                if (sTBSearch != "") {
                    var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
                    if (sTBSearch != sTT) {
                        if (!bDoNotSearch) {
                            WSProOverlay.MMToolbarSearch(sTBSearch, sSearchEngine, false);
                            bSearched = true;
                        }
                    }
                }
            }
        }
        //Update the dropzones.
        if (WSProOverlay.oUtils.GetString("mmsearch-defaultse") != "" || bFromMenu) WSProOverlay.WSProAssignCurrentFSEToDropZones(sSearchEngine);
        //if (bFromMenu && document.getElementById('MMSearchTBTextbox')) document.getElementById('MMSearchTBTextbox').focus();

        //Alert other windows.
        var oWindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
        var oWindowManagerInterface = oWindowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
        var oWindows = oWindowManagerInterface.getEnumerator("navigator:browser");
        var oWindow;
        while(oWindows.hasMoreElements()) {
            oWindow = oWindows.getNext();
            if (typeof(oWindow.WSProOverlay.MMSearchInitToolbar) == "function") oWindow.WSProOverlay.MMSearchInitToolbar(false);
        }
        WSProOverlay.ProcessToolbarFocus(true);

        return bSearched;
    },

    WSProHandleToolbarGroupClick: function (event, sID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProHandleToolbarGroupClick(" + event.button + ", '" + sID + "')");
        if (sID == event.target.id) {
            if (event.button != 2) {
                WSProOverlay.WSProHidePopups();
                WSProOverlay.SetSearchEngine(sID, true);
            }
        }
    },

    WSProToolbarMClickSetSearchEngine: function (sSearchEngine, bFromMenu, bForceSwitchEngine, oEvent) {
        if (oEvent.button == 1) {
            this.bDisableHidePopups = true;
            var oTB = document.getElementById('MMSearchTBTextbox');
            WSProOverlay.MMToolbarSearch(oTB.value, sSearchEngine, false);
            this.bDisableHidePopups = false;
        }
    },

    MMSearchScrollEnginesMouse: function (oEvent) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("MMSearchScrollEnginesMouse");
        if (oEvent.detail < 0) WSProOverlay.MMSearchScrollEngines(false);
        else WSProOverlay.MMSearchScrollEngines(true);
    },

    MMSearchScrollEngines: function (bScrollDown) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.MMSearchScrollEngines('" + bScrollDown + "')");
        if (!WSProOverlay.oUtils) WSProOverlay.oUtils = new MMSearchUtils();

        var oNextEngine, oCurrentEngine;
        var sNextSearchEngine = "",
            sCurrentSearchEngine = WSProOverlay.oUtils.GetString("mmsearch-preferedsearchengine");

        oCurrentEngine = document.getElementById(sCurrentSearchEngine);
        if (oCurrentEngine) {
            if (!bScrollDown) {
                oNextEngine = oCurrentEngine.previousSibling;
                while(oNextEngine && oNextEngine.hidden) oNextEngine = oNextEngine.previousSibling;
                if (oNextEngine) sNextSearchEngine = oNextEngine.id;
            } else {
                oNextEngine = oCurrentEngine.nextSibling;
                while(oNextEngine && oNextEngine.hidden) oNextEngine = oNextEngine.nextSibling;
                if (oNextEngine) sNextSearchEngine = oNextEngine.id;
            }
            if (sNextSearchEngine && sNextSearchEngine != "clone-mmsearch-searchfreesearch-toolbar" && sNextSearchEngine != "mspopupbeforeoptions" && sNextSearchEngine != "mmsearch-options-toolbar") {
                sNextSearchEngine = sNextSearchEngine.replace('mmsearch-search', '')
                sNextSearchEngine = sNextSearchEngine.replace('-toolbar', '')
                WSProOverlay.SetSearchEngine(sNextSearchEngine, false, true, null, true);
            }
        }
    },

    MMToolbarSearch: function (sSearchText, sSearchEngine, bSetSearchEngine, aDynamicSearchParams) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.MMToolbarSearch('" + sSearchText + "', '" + sSearchEngine + "', '" + bSetSearchEngine + "', '" + aDynamicSearchParams + "')");
        //Start a search from the toolbar.
        if (!sSearchEngine) sSearchEngine = WSProOverlay.oUtils.GetString("mmsearch-preferedsearchengine");
        this.sCurrentSearchText = sSearchText;
        WSProOverlay.MMPopupSearch(sSearchEngine, bSetSearchEngine, aDynamicSearchParams);

        if (WSProOverlay.oUtils.GetString('mmsearch-defaultse') != "") {
            var sFSEID = WSProOverlay.oUtils.GetString('mmsearch-defaultse');
            if (sFSEID == "recentfseid") sFSEID = sSearchEngine;
            sFSEID = sFSEID.replace('ct_fse_', '');
            sFSEID = sFSEID.replace('tb_fse_', '');

            WSProOverlay.SetSearchEngine('tb_fse_' + sFSEID, false, false, null, true);
        }

        WSProOverlay.MMSaveHistory(sSearchText);
        this.sCurrentSearchText = "";
    },

    PreHotKeySearch: function (sKey, sFSEID, bIsDefaultWSProKey) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.PreWSProOverlay.HotKeySearch('" + sKey + "', '" + sFSEID + "')");
        if (WSProOverlay.oUtils.GetBool("mmsearch-useqtsinsteadoftoolbar")) {
            return WSProOverlay.WSProQuickTypeSearch(sFSEID);
        } else {
            WSProOverlay.HotKeySearch(sKey, sFSEID, bIsDefaultWSProKey);
        }
    },

    HotKeySearch: function (sKey, sFSEID, bIsDefaultWSProKey) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.HotKeySearch('" + sKey + "', '" + sFSEID + "')");
        if (!sFSEID || sFSEID == "") sFSEID = WSProOverlay.oUtils.GetString("mmsearch-preferedsearchengine");
        this.sCurrentSearchText = "";
        var oToolbar = document.getElementById("MMSearchToolbarContainer");
        var sSelectedText = WSProOverlay.MMSearchGetSelectedText();

        if (!document.getElementById(sFSEID)) sFSEID = sFSEID.replace("tb_fse_", "tb-group-wspro-");
        if (!document.getElementById(sFSEID) || document.getElementById(sFSEID).hidden) sFSEID = sFSEID.replace("tb-group-wspro-", "tb-vlist-wspro-");
        if (!document.getElementById(sFSEID) || document.getElementById(sFSEID).hidden) sFSEID = sFSEID.replace("tb-vlist-wspro-", "ct-group-wspro-");
        if (!document.getElementById(sFSEID) || document.getElementById(sFSEID).hidden) sFSEID = sFSEID.replace("ct-group-wspro-", "ct-vlist-wspro-");

        if (oToolbar && !oToolbar.parentNode.parentNode.collapsed && !(window.getComputedStyle(oToolbar.parentNode, null).display == "none")) {
            var oTB = document.getElementById('MMSearchTBTextbox');
            var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
            if (oTB.value == sTT && oTB.getAttribute('hasfocus') == "false") oTB.value = "";
            if (oTB.value != "" && sKey == "" && !bIsDefaultWSProKey) {
                sSelectedText = oTB.value;
                oTB.setAttribute('usevalueforsearch', "true");
            }
            if (!bIsDefaultWSProKey) oTB.value = "";
            var bSearched = WSProOverlay.SetSearchEngine(sFSEID, false, false, null, true);
            if (sSelectedText == "") {
                if (WSProOverlay.oUtils.GetBool("mmsearch-useqtsinsteadoftoolbar")) {
                    return WSProOverlay.WSProQuickTypeSearch(sFSEID);
                } else {
                    return document.getElementById('MMSearchTBTextbox').focus();
                }
            }
            if (!bSearched) {
                if (oTB) oTB.value = sSelectedText;
                WSProOverlay.MMToolbarSearch(sSelectedText, sFSEID, false);
            }

        } else {
            if (!sSelectedText || sSelectedText == "") return WSProOverlay.WSProQuickTypeSearch(sFSEID);
            WSProOverlay.MMPopupSearch(sFSEID, true);
        }
        return true;
    },

    WSProFastFindKeyPress: function (oEvent) {
        if (oEvent.keyCode == 13 && oEvent.shiftKey) {
            var sText = document.getElementById("FindToolbar")._findField.value;
            if (sText && sText != "") {
                var sFSEID = document.defaultView.WSProOverlay.oUtils.GetString("mmsearch-preferedsearchengine");
                WSProOverlay.MMToolbarSearch(sText, sFSEID, false);
            }
        }
    },

    WSProQuickTypeSearch: function (sFSEID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProQuickTypeSearch('" + sFSEID + "')");
        sFSEID = sFSEID.replace('ct_fse_', '');
        sFSEID = sFSEID.replace('tb_fse_', '');
        sFSEID = sFSEID.replace("tb-vlist-wspro-", "");
        sFSEID = sFSEID.replace("tb-group-wspro-", "");
        sFSEID = sFSEID.replace("ct-vlist-wspro-", "");
        sFSEID = sFSEID.replace("ct-group-wspro-", "");

        var sSelectedText = WSProOverlay.MMSearchGetSelectedText();
        if (sSelectedText && sSelectedText != "") {
            this.sLastQTSSearchTerm = sSelectedText;
            this.aLastQTSSearchEngines = new Array();
            this.aLastQTSDynamicSearchParams = new Array();
        }
        window.openDialog("chrome://websearchpro/content/websearchproquicktypesearch.xul", "wspro-qts", "chrome,centerscreen,modal,titlebar=no", {sFSEID: sFSEID, sLastQTSSearchTerm: this.sLastQTSSearchTerm, aLastQTSSearchEngines: this.aLastQTSSearchEngines, aLastQTSDynamicSearchParams: this.aLastQTSDynamicSearchParams});
    },

    MMSearchDragDropSearch: function (sSearchEngine, sText) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.MMSearchDragDropSearch('" + sSearchEngine + "', '" + sText + "')");
        var oTextBox = document.getElementById("MMSearchTBTextbox");
        if (oTextBox) oTextBox.value = sText;
        
        this.sCurrentSearchType = "dend";
        
        WSProOverlay.MMToolbarSearch(sText, sSearchEngine, false);
    },

    MMSearchPasteSearch: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("MMSearchPasteSearch");

        var oTextBox = document.getElementById("MMSearchTBTextbox");
        var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
        if (oTextBox.value == sTT && oTextBox.getAttribute('hasfocus') == "false") oTextBox.value = "";

        if (WSProOverlay.oUtils.GetBool("mmsearch-searchondrop")) {
            if (!oTextBox.value || oTextBox.value == "") return setTimeout(function () {WSProOverlay.MMSearchPasteSearch();}, 1);
            WSProOverlay.MMToolbarSearch(oTextBox.value, false);
        }
        return true;
    },

    MMPopupPreSearch: function (sSearchEngine) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.MMPopupPreSearch('" + sSearchEngine + "')");
        var oTextBox = document.getElementById("MMSearchTBTextbox");
        if (oTextBox) oTextBox.value = "";
        
        this.sCurrentSearchType = "cm";

        setTimeout(function () {WSProOverlay.MMPopupSearch(sSearchEngine, true);}, 5);
    },

    MMPopupSearch: function (sSearchEngine, bSetSearchEngine, aDynamicSearchParams) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.MMPopupSearch('" + sSearchEngine + "', '" + bSetSearchEngine + "', '" + aDynamicSearchParams + "')");
        if (document.getElementById('wspro-se-context') && document.getElementById('wspro-se-context').getAttribute('showing') == 'true') return false;
        WSProOverlay.WSProHidePopups();

        var oURI;
        var oRegExp;
        var sSelectedText = WSProOverlay.MMSearchGetSelectedText();
        var sOriginalSelectedText = sSelectedText;
        var sSearchURI = "";
        var sMethod = "GET";
        var sWSProEncoding = "";
        var iPos1, iPos2, iGroupIndex;
        var iDIndex, iDLen = 0;
        var bSearch;
        
        if (aDynamicSearchParams) {
            iDLen = aDynamicSearchParams.length;
            sSelectedText = aDynamicSearchParams[0][2];
            sOriginalSelectedText = sSelectedText;
        }

        var oTTSURI = Components.classes["@mozilla.org/intl/texttosuburi;1"].getService(Components.interfaces.nsITextToSubURI);

        var oTB = document.getElementById('MMSearchTBTextbox')
        if (oTB) {
            var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
            if (oTB.value == sTT && oTB.getAttribute('hasfocus') == "false") oTB.value = "";
            if (oTB.value != "" && oTB.getAttribute('usevalueforsearch') == "true") {
                sSelectedText = oTB.value;
                sOriginalSelectedText = sSelectedText;
                oTB.setAttribute('usevalueforsearch', "false");
            }
        }
        sSearchEngine = sSearchEngine.replace("tb_fse_", "");
        sSearchEngine = sSearchEngine.replace("ct_fse_", "");
        sSearchEngine = sSearchEngine.replace("tb-vlist-wspro-", "");
        sSearchEngine = sSearchEngine.replace("tb-group-wspro-", "");
        sSearchEngine = sSearchEngine.replace("ct-vlist-wspro-", "");
        sSearchEngine = sSearchEngine.replace("ct-group-wspro-", "");

        iGroupIndex = WSProOverlay.WSProGetGroupIndex(sSearchEngine);
        if (sSearchEngine.length == 20 || iGroupIndex >= 0) //Group/List item = searchall
        {
            var sFSEType = sSearchEngine;
            if (iGroupIndex < 0) sFSEType = sSearchEngine.substr(15, 5);
            var iIndex, iLen = this.aFreeSearchEngines.length;

            for (iIndex = 0; iIndex < iLen; iIndex++) {
                bSearch = false;
                if (sFSEType == this.aFreeSearchEngines[iIndex][3]) bSearch = true;

                if (bSearch) {
                    var sFSEID = this.aFreeSearchEngines[iIndex][0];
                    WSProOverlay.oUtils.WSProAddSEStat(sFSEID);
                    if (this.aFreeSearchEngines[iIndex][0] == "-8") {
                        var sLocale = WSProOverlay.GetLocale();
                        var sSLocale = sLocale.substr(0, 2);
                        sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                        sSearchURI = 'http://www.google.com/search?hl=' + sLocale + '&hl=' + sSLocale + '&q=' + sSelectedText;
                        WSProOverlay.WSProPerformSearchDelayed(sSearchURI, true, sFSEID, "GET", sSelectedText, WSProOverlay.sWSProDefaultEncoding);
                    } else if (this.aFreeSearchEngines[iIndex][0] == "-14") //Google Site Search
                    {
                        var sSite = WSProOverlay.oUtils.GetDomainFromURI(content.location.href);
                        sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                        sSearchURI = 'http://www.google.com/search?q=site:' + sSite + ' ' + sSelectedText;
                        WSProOverlay.WSProPerformSearchDelayed(sSearchURI, true, sFSEID, "GET", sSelectedText, WSProOverlay.sWSProDefaultEncoding);
                    } else if (this.aFreeSearchEngines[iIndex][0] == "-15") //Google Site Search Full URL
                    {
                        var sSite = content.location.href;
                        sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                        sSearchURI = 'http://www.google.com/search?q=site:' + sSite + ' ' + sSelectedText;
                        WSProOverlay.WSProPerformSearchDelayed(sSearchURI, true, sFSEID, "GET", sSelectedText, WSProOverlay.sWSProDefaultEncoding);
                    }
                    else {
                        sSearchURI = this.aFreeSearchEngines[iIndex][2];
                        if (this.aFreeSearchEngines[iIndex][0].substr(0, 1) == "f") {
                            //Get the Sherlock/Open Search defined encoding
                            var sFFEncoding = this.sWSProDefaultEncoding;
                            var aFFIDs = WSProOverlay.oUtils.WSProGetLinkedFFSEArray();
                            var iFSEIDIndex = WSProOverlay.oUtils.WSProGetLinkedFFSEIndex(aFFIDs, "", this.aFreeSearchEngines[iIndex][0])
                            if (iFSEIDIndex >= 0) {
                                var sFFID = aFFIDs[iFSEIDIndex][0];
                                var oSS = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);
                                var oEngines = oSS.getEngines({});
                                var iFFIndex, iFFLen = oEngines.length;
                                for (iFFIndex = 0; iFFIndex < iFFLen; iFFIndex++) {
                                    if (sFFID == oEngines[iFFIndex].wrappedJSObject._id) {
                                        sFFEncoding = oEngines[iFFIndex].wrappedJSObject.queryCharset;
                                        oURI = oEngines[iFFIndex].wrappedJSObject._getURLOfType("text/html");
                                        sMethod = oURI.method;

                                        break;
                                    }
                                }
                            }
                            try {
                                sSelectedText = oTTSURI.ConvertAndEscape(sFFEncoding, sOriginalSelectedText);
                                sWSProEncoding = sFFEncoding;
                            }
                            catch(e) {
                                sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                                sWSProEncoding = this.sWSProDefaultEncoding;
                            }
                        } else {
                            sWSProEncoding = this.sWSProDefaultEncoding;
                            if (sSearchURI.indexOf("wsproencoding") >= 0) {
                                iPos1 = sSearchURI.indexOf("wsproencoding");
                                iPos2 = sSearchURI.indexOf("&", iPos1);
                                sWSProEncoding = sSearchURI.substring(iPos1, iPos2);
                                sSearchURI = sSearchURI.replace(sWSProEncoding + "&", "");
                                sWSProEncoding = sWSProEncoding.replace("wsproencoding=", "");
                            }
                            try {
                                sSelectedText = oTTSURI.ConvertAndEscape(sWSProEncoding, sOriginalSelectedText);
                            }
                            catch(e) {
                                sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                            }
                        }
                        if (sSearchURI.indexOf("{searchTerms") == -1) sSearchURI = sSearchURI + "{searchTerms}";
                        sMethod = "GET";
                        if (sSearchURI.indexOf("httppost") >= 0 || sSearchURI.indexOf("httpspost") >= 0) {
                            sSearchURI = sSearchURI.replace("httpspost", "https");
                            sSearchURI = sSearchURI.replace("httppost", "http");
                            sMethod = "POST";
                        }
                        if (iDLen == 0)
                        {
                            //sSearchURI = sSearchURI.replace(/\{searchTerms\??\}/g, sSelectedText);
                            sSearchURI = sSearchURI.replace(/\{searchTerms??(.+?)\}/g, sSelectedText);
                        }
                        else
                        {
                            sSelectedText = "";
                            for (iDIndex = 0; iDIndex < iDLen; iDIndex ++)
                            {
                                oRegExp = new RegExp(aDynamicSearchParams[iDIndex][0], "g");
                                if (sSearchURI.match(oRegExp))
                                {
                                    if (sSelectedText != "") sSelectedText += ",";
                                    sSelectedText += aDynamicSearchParams[iDIndex][1] + ": " + aDynamicSearchParams[iDIndex][2];
                                }
                                sSearchURI = sSearchURI.replace(oRegExp, aDynamicSearchParams[iDIndex][2]);
                            }
                        }
                        WSProOverlay.WSProPerformSearchDelayed(sSearchURI, true, sFSEID, sMethod, sSelectedText, sWSProEncoding);
                    }
                }
            }
        }
        else {
            if (sSearchEngine == "tb_fse_-8" || sSearchEngine == "ct_fse_-8" || sSearchEngine == "-8") {
                var sLocale = WSProOverlay.GetLocale();
                var sSLocale = sLocale.substr(0, 2);
                sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                sSearchURI = 'http://www.google.com/search?hl=' + sLocale + '&hl=' + sSLocale + '&q=' + sSelectedText;
                WSProOverlay.WSProPerformSearch(sSearchURI, false, sSearchEngine, sMethod, sSelectedText)
                WSProOverlay.oUtils.WSProAddSEStat("-8");
            } else if (sSearchEngine == "tb_fse_-14" || sSearchEngine == "ct_fse_-14" || sSearchEngine == "-14") {
                var sSite = WSProOverlay.oUtils.GetDomainFromURI(content.location.href);
                sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                sSearchURI = 'http://www.google.com/search?q=site:' + sSite + ' ' + sSelectedText;
                WSProOverlay.WSProPerformSearch(sSearchURI, false, sSearchEngine, sMethod, sSelectedText)
                WSProOverlay.oUtils.WSProAddSEStat("-14");
            } else if (sSearchEngine == "tb_fse_-15" || sSearchEngine == "ct_fse_-15" || sSearchEngine == "-15") {
                var sSite = content.location.href;
                sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                sSearchURI = 'http://www.google.com/search?q=site:' + sSite + ' ' + sSelectedText;
                WSProOverlay.WSProPerformSearch(sSearchURI, false, sSearchEngine, sMethod, sSelectedText)
                WSProOverlay.oUtils.WSProAddSEStat("-15");
            } else {
                var oFSEElement = document.getElementById(sSearchEngine);
                if (!oFSEElement) oFSEElement = document.getElementById(sSearchEngine.replace('tb_fse', 'ct_fse')); //Toolbar disabled, use context item...
                if (!oFSEElement) oFSEElement = document.getElementById('ct_fse_' + sSearchEngine); //Just the FSEID...
                if (oFSEElement) {
                    var sURL = oFSEElement.getAttribute('fseurl');
                    var sFSEID = oFSEElement.getAttribute('fseid');
                    WSProOverlay.oUtils.WSProAddSEStat(sFSEID);

                    if (WSProOverlay.WSProUsePlusForSpaceChar(oFSEElement.getAttribute('fseid'))) sSelectedText = sSelectedText.replace(/%20/g, '+');

                    sSearchURI = sURL;
                    if (sFSEID.substr(0, 1) == "f") {
                        //Get the Sherlock/Open Search defined encoding
                        var sFFEncoding = this.sWSProDefaultEncoding;
                        var aFFIDs = WSProOverlay.oUtils.WSProGetLinkedFFSEArray();
                        var iFSEIDIndex = WSProOverlay.oUtils.WSProGetLinkedFFSEIndex(aFFIDs, "", sFSEID)
                        if (iFSEIDIndex >= 0) {
                            var sFFID = aFFIDs[iFSEIDIndex][0];
                            var oSS = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);
                            var oEngines = oSS.getEngines({});
                            var iFFIndex, iFFLen = oEngines.length;
                            for (iFFIndex = 0; iFFIndex < iFFLen; iFFIndex++) {
                                if (sFFID == oEngines[iFFIndex].wrappedJSObject._id) {
                                    sFFEncoding = oEngines[iFFIndex].wrappedJSObject.queryCharset;
                                    oURI = oEngines[iFFIndex].wrappedJSObject._getURLOfType("text/html");
                                    sMethod = oURI.method;
                                    break;
                                }
                            }
                        }
                        try {
                            sSelectedText = oTTSURI.ConvertAndEscape(sFFEncoding, sOriginalSelectedText);
                        }
                        catch(e) {
                            sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                        }
                    } else {
                        sWSProEncoding = this.sWSProDefaultEncoding;
                        if (sSearchURI.indexOf("wsproencoding") >= 0) {
                            iPos1 = sSearchURI.indexOf("wsproencoding");
                            iPos2 = sSearchURI.indexOf("&", iPos1);
                            sWSProEncoding = sSearchURI.substring(iPos1, iPos2);
                            sSearchURI = sSearchURI.replace(sWSProEncoding + "&", "");
                            sWSProEncoding = sWSProEncoding.replace("wsproencoding=", "");
                        }
                        try {
                            sSelectedText = oTTSURI.ConvertAndEscape(sWSProEncoding, sOriginalSelectedText);
                        }
                        catch(e) {
                            sSelectedText = oTTSURI.ConvertAndEscape(this.sWSProDefaultEncoding, sOriginalSelectedText);
                        }
                    }
                    if (sSearchURI.indexOf("{searchTerms") == -1) sSearchURI = sSearchURI + "{searchTerms}";
                    sMethod = "GET";
                    if (sSearchURI.indexOf("httppost") >= 0 || sSearchURI.indexOf("httpspost") >= 0) {
                        sSearchURI = sSearchURI.replace("httpspost", "https");
                        sSearchURI = sSearchURI.replace("httppost", "http");
                        sMethod = "POST";
                    }
                    if (iDLen == 0)
                    {
                        //sSearchURI = sSearchURI.replace(/\{searchTerms\??\}/g, sSelectedText);
                        sSearchURI = sSearchURI.replace(/\{searchTerms??(.+?)\}/g, sSelectedText);
                    }
                    else
                    {
                        sSelectedText = "";
                        for (iDIndex = 0; iDIndex < iDLen; iDIndex ++)
                        {
                            oRegExp = new RegExp(aDynamicSearchParams[iDIndex][0], "g");
                            if (sSearchURI.match(oRegExp))
                            {
                                if (sSelectedText != "") sSelectedText += ",";
                                sSelectedText += aDynamicSearchParams[iDIndex][1] + ": " + aDynamicSearchParams[iDIndex][2];
                            }
                            sSearchURI = sSearchURI.replace(oRegExp, aDynamicSearchParams[iDIndex][2]);
                        }
                    }

                    WSProOverlay.WSProPerformSearch(sSearchURI, false, sSearchEngine, sMethod, sSelectedText, sWSProEncoding);
                }
            }
        }
        sSearchEngine = sSearchEngine.replace('ct-', 'tb-');
        sSearchEngine = sSearchEngine.replace('ct_', 'tb_');
        if (WSProOverlay.oUtils.GetString('mmsearch-defaultse') != "") {
            var sFSEID = WSProOverlay.oUtils.GetString('mmsearch-defaultse');
            if (sFSEID == "recentfseid") sFSEID = sSearchEngine;
            sFSEID = sFSEID.replace('ct_fse_', '');
            sFSEID = sFSEID.replace('tb_fse_', '');

            sSearchEngine = 'tb_fse_' + sFSEID;
        }

        if (bSetSearchEngine) WSProOverlay.SetSearchEngine(sSearchEngine, false, false, null, true);
        WSProOverlay.CloseAutoCompletePopup();
        
        this.sCurrentSearchType = "";

        return true;
    },

    WSProPerformSearchDelayed: function (sURI, bForceInTabs, sFSEID, sMethod, sSelectedText, sWSProEncoding) {
        setTimeout(function () {WSProOverlay.WSProPerformSearch(sURI, bForceInTabs, sFSEID, sMethod, sSelectedText, sWSProEncoding);}, 10);
    },
    
    WSProPerformSearch: function (sURI, bForceInTabs, sFSEID, sMethod, sSelectedText, sWSProEncoding) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProPerformSearch('" + sURI + "', '" + bForceInTabs + "', '" + sFSEID + "', '" + sMethod + "', '" + sSelectedText + "')");
        var oBrowser
        var oTab;
        var sLocation = content.document.location.href;
        sFSEID = sFSEID.replace('ct_fse_', '');
        sFSEID = sFSEID.replace('tb_fse_', '');

        var iFSEIndex = WSProOverlay.WSProGetFSEIDIndex(sFSEID);
        var sTabLabel = "";
        if (iFSEIndex >= 0)
        {
            if (!sWSProEncoding) sWSProEncoding = WSProOverlay.sWSProDefaultEncoding;
            var oTTSURI = Components.classes["@mozilla.org/intl/texttosuburi;1"].getService(Components.interfaces.nsITextToSubURI);
            try {
                sTabLabel = '"' + oTTSURI.UnEscapeAndConvert(sWSProEncoding, sSelectedText) + '" - ' + WSProOverlay.aFreeSearchEngines[iFSEIndex][1];
            } catch (e) {
                try {
                    var oCharsetPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("intl.charset.");
                    sWSProEncoding = oCharsetPref.getCharPref("default");
                    sTabLabel = '"' + oTTSURI.UnEscapeAndConvert(sWSProEncoding, sSelectedText) + '" - ' + WSProOverlay.aFreeSearchEngines[iFSEIndex][1];
                } catch (e) {sTabLabel = "";}
            }
        }

        var oPostData = null;
        if (sMethod == "POST") {
            var sData = "";
            var iIndex = sURI.lastIndexOf('?');
            if (iIndex >= 0) {
                var sData = sURI.substr(iIndex + 1);
                sURI = sURI.substr(0, iIndex);
            }
            var stringStream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
            stringStream.setData(sData, sData.length);
            oPostData = Cc["@mozilla.org/network/mime-input-stream;1"].createInstance(Ci.nsIMIMEInputStream);
            oPostData.addHeader("Content-Type", "application/x-www-form-urlencoded");
            oPostData.addContentLength = true;
            oPostData.setData(stringStream);
        }

        if (WSProOverlay.oUtils.GetBool("mmsearch-reuseopenedtabs") == true && (WSProOverlay.OpenCurrentSearchInNewTab() == true || bForceInTabs == true)) {
            if (this.bNewTabKeyDown) {
                oTab = WSProOverlay.openNewTabWithReturn(sURI, oPostData);
                if (sTabLabel != "")
                {
                    oTab.setAttribute('wsprolabel', sTabLabel);
                }
                if ((WSProOverlay.LoadCurrentSearchInForegroundTab() || this.bForegroundKeyDown == true) && this.bBackgroundKeyDown == false) getBrowser().selectedTab = oTab;
            } else if (this.bCurrentTabKeyDown || (sLocation == "about:blank" && !window.top.getBrowser().mTabBox.selectedTab.getAttribute('wspro_tab_fseid'))) {
                window.loadURI(sURI, null, oPostData);
                window.top.getBrowser().mTabBox.selectedTab.setAttribute('wspro_tab_fseid', sFSEID);
            } else {
                var oTabs = document.getElementsByAttribute('wspro_tab_fseid', sFSEID);
                if (oTabs && oTabs.length > 0) oTab = oTabs[0];
                if (oTab) {
                    oBrowser = oTab.linkedBrowser; //WSProOverlay.GetBrowser(oTab);
                    if (oBrowser) oBrowser.webNavigation.loadURI(sURI, null, null, oPostData, null);
                    if (sTabLabel != "") oTab.setAttribute('wsprolabel', sTabLabel);
                    if ((WSProOverlay.LoadCurrentSearchInForegroundTab() || this.bForegroundKeyDown == true) && this.bBackgroundKeyDown == false) getBrowser().selectedTab = oTab;
                } else {
                    oTab = WSProOverlay.openNewTabWithReturn(sURI, oPostData);
                    if (sTabLabel != "") oTab.setAttribute('wsprolabel', sTabLabel);
                    oTab.setAttribute('wspro_tab_fseid', sFSEID);
                    if ((WSProOverlay.LoadCurrentSearchInForegroundTab() || this.bForegroundKeyDown == true) && this.bBackgroundKeyDown == false) getBrowser().selectedTab = oTab;
                }
            }
        } else {
            if (WSProOverlay.OpenCurrentSearchInNewTab() == true || bForceInTabs == true) {
                if (this.bCurrentTabKeyDown == false) {
                    oTab = WSProOverlay.openNewTabWithReturn(sURI, oPostData);
                    if (sTabLabel != "") oTab.setAttribute('wsprolabel', sTabLabel);
                    if ((WSProOverlay.LoadCurrentSearchInForegroundTab() || this.bForegroundKeyDown == true) && this.bBackgroundKeyDown == false) getBrowser().selectedTab = oTab;
                } else {
                    window.loadURI(sURI, null, oPostData);
                }
            } else {
                if (this.bNewTabKeyDown == false) {
                    window.loadURI(sURI, null, oPostData);
                } else {
                    oTab = WSProOverlay.openNewTabWithReturn(sURI, oPostData);
                    if (sTabLabel != "") oTab.setAttribute('wsprolabel', sTabLabel);
                    if ((WSProOverlay.LoadCurrentSearchInForegroundTab() || this.bForegroundKeyDown == true) && this.bBackgroundKeyDown == false) getBrowser().selectedTab = oTab;
                }
            }
        }

        if (WSProOverlay.oUtils.GetBool("mmsearch-clearsearchbox") && document.getElementById('MMSearchTBTextbox')) document.getElementById('MMSearchTBTextbox').value = "";
        WSProOverlay.WSProResetActionKeys();
    },
    
    OpenCurrentSearchInNewTab: function()
    {
        var bNewTabPref = WSProOverlay.oUtils.GetBool("mmsearch-resultsinnewtab");
        if (this.sCurrentSearchType == "dend") bNewTabPref = WSProOverlay.oUtils.GetBool("mmsearch-resultsinnewtab-dend");
        if (this.sCurrentSearchType == "cm") bNewTabPref = WSProOverlay.oUtils.GetBool("mmsearch-resultsinnewtab-cm");
        if (this.sCurrentSearchType == "qts") bNewTabPref = WSProOverlay.oUtils.GetBool("mmsearch-resultsinnewtab-qts");
        
        return bNewTabPref;
    },

    LoadCurrentSearchInForegroundTab: function()
    {
        var bForegroundTabPref = WSProOverlay.oUtils.GetBool("mmsearch-loadsearchtabsinforeground");
        if (this.sCurrentSearchType == "dend") bForegroundTabPref = WSProOverlay.oUtils.GetBool("mmsearch-loadsearchtabsinforeground-dend");
        if (this.sCurrentSearchType == "cm") bForegroundTabPref = WSProOverlay.oUtils.GetBool("mmsearch-loadsearchtabsinforeground-cm");
        if (this.sCurrentSearchType == "qts") bForegroundTabPref = WSProOverlay.oUtils.GetBool("mmsearch-loadsearchtabsinforeground-qts");
        
        return bForegroundTabPref;
    },

    openNewTabWithReturn: function (href, oPostData) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.openNewTabWithReturn('" + href + "')");
        //Open link in new tab
        var browser = top.document.getElementById("content");
        //var wintype = document.firstChild.getAttribute('windowtype');
        var wintype = document.documentElement.getAttribute("windowtype");
        var originCharset;
        if (wintype == "navigator:browser") originCharset = window.content.document.characterSet;

        var sourceURL = browser.contentDocument.location.href;
        var referrerURI = sourceURL ? makeURI(sourceURL) : null;

        var oTab = browser.loadOneTab(href, referrerURI, originCharset, oPostData, null, false);

        return oTab;
    },

    GetBrowser: function (oTab) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("GetBrowser");
        var oBrowser = getBrowser();
        return oBrowser.getBrowserForTab(oTab);
    },

    MMToolbarFocus: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("MMToolbarFocus");
        //Set focus on the MMSearch toolbar textbox.
        document.getElementById('MMSearchTBTextbox').focus();
    },

    MMSaveHistory: function (sText) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.MMSaveHistory('" + sText + "')");
        if (sText != "") {
            // Add item to form history
            if ("nsIFormHistory2" in Components.interfaces) {
                var oFormHistory = Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory2);
            } else {
                var oFormHistory = Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory);
            }
            oFormHistory.addEntry("mmsearch-history", sText);
        }
    },

    ProcessToolbarKey: function (oTextbox, oEvent) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.ProcessToolbarKey('" + oEvent.keyCode + "')");
        var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
        if (oTextbox.value == sTT && oTextbox.getAttribute('hasfocus') == "false") oTextbox.value = "";

        if (oEvent.keyCode == 13) return WSProOverlay.MMToolbarSearch(oTextbox.value, null, false); //RETURN
        if (oEvent.keyCode == 115) //F4
        {
            var oElement = document.getElementById('MMSearchTBButton')
            var iX = WSProOverlay.oUtils.FindPosX(oElement);
            var iY = WSProOverlay.oUtils.FindPosY(oElement) + parseInt(oElement.boxObject.height);
            return document.getElementById('mmsearchpopupsearchengine').showPopup(oElement, iX, iY, 'popup');
        }
        if (oEvent.which == 118 && oEvent.ctrlKey) return setTimeout(function () {WSProOverlay.MMSearchPasteSearch();}, 1); //v
        if (oEvent.keyCode == 38 && oEvent.ctrlKey) return WSProOverlay.MMSearchScrollEngines(false); //UP
        if (oEvent.keyCode == 40 && oEvent.ctrlKey) return WSProOverlay.MMSearchScrollEngines(true); //DOWN
        if (oEvent.keyCode == 37 || oEvent.keyCode == 39) {
            var oText = document.getElementById('MMSearchTBTextbox')
            var iWidth = parseInt(oText.width);
            if (!iWidth || iWidth < 10) iWidth = 275;
            if (oEvent.keyCode == 37 && oEvent.altKey && oEvent.ctrlKey) iWidth = (iWidth - 5);
            if (oEvent.keyCode == 39 && oEvent.altKey && oEvent.ctrlKey) iWidth = (iWidth + 5);
            oText.width = iWidth;
        }

        return true;
    },

    WSProLogActionKeysDown: function (oEvent) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProLogActionKeysDown('" + oEvent.keyCode + "')");
        if (oEvent.keyCode == 70) this.bForegroundKeyDown = true; //F
        if (oEvent.keyCode == 66) this.bBackgroundKeyDown = true; //B
        if (oEvent.keyCode == 78) this.bNewTabKeyDown = true; //N
        if (oEvent.keyCode == 67) this.bCurrentTabKeyDown = true; //C
        if (oEvent.keyCode == 13 && oEvent.altKey) this.bNewTabKeyDown = true; //ALT + ENTER
    },

    WSProLogActionKeysUp: function (oEvent) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProLogActionKeysUp('" + oEvent.keyCode + "')");
        if (oEvent.keyCode == 70) this.bForegroundKeyDown = false; //F
        if (oEvent.keyCode == 66) this.bBackgroundKeyDown = false; //B
        if (oEvent.keyCode == 78) this.bNewTabKeyDown = false; //N
        if (oEvent.keyCode == 67) this.bCurrentTabKeyDown = false; //C
        if (oEvent.keyCode == 13 && oEvent.altKey) this.bNewTabKeyDown = false; //ALT + ENTER
    },

    WSProResetActionKeys: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProResetActionKeys");
        this.bForegroundKeyDown = false;
        this.bBackgroundKeyDown = false;
        this.bNewTabKeyDown = false;
        this.bCurrentTabKeyDown = false;
    },

    WSProSaveHoverText: function (oEvent) {
        if (document.getElementById('contentAreaContextMenu') && document.getElementById('contentAreaContextMenu').getAttribute("wspro_isvisible") == "false") {
            if (oEvent && oEvent.rangeParent && oEvent.rangeParent.nodeType == document.TEXT_NODE) {
                if (oEvent.rangeParent.data && oEvent.rangeOffset) {
                    WSProOverlay.sWSProHoverText = oEvent.rangeParent.data;
                    WSProOverlay.iWSProHoverTextIndex = oEvent.rangeOffset;
                }
            }
        }
    },

    ProcessToolbarFocus: function (bGotFocus) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.ProcessToolbarFocus('" + bGotFocus + "')");
        var oTextbox = document.getElementById("MMSearchTBTextbox");
        if (oTextbox) {
            var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
            if (oTextbox) {
                if (bGotFocus) {
                    if (oTextbox.value == sTT && oTextbox.getAttribute('hasfocus') == "false") oTextbox.value = "";
                    oTextbox.select();
                    WSProOverlay.WSProHidePopups();
                } else {
                    if (oTextbox.value == "" && !WSProOverlay.oUtils.GetBool("mmsearch-hidecurrentselabel")) {
                        oTextbox.value = sTT;
                    }
                }
                oTextbox.setAttribute('hasfocus', bGotFocus);
            }
        }
    },

    DisableToolbarAutoComplete: function (bDisable) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.DisableToolbarAutoComplete('" + bDisable + "')");
        var oTB = document.getElementById('MMSearchTBTextbox');
        oTB.setAttribute('disableAutoComplete', bDisable);
        var sTT = document.getElementById('mmsearchenginetooltip').firstChild.getAttribute('value');
        if (oTB.value == sTT && oTB.getAttribute('hasfocus') == "false") oTB.value = "";
        oTB.setAttribute('hasfocus', true);

        setTimeout(function () {WSProOverlay.CloseAutoCompletePopup();}, 50);
    },

    CloseAutoCompletePopup: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("CloseAutoCompletePopup");
        var oTB = document.getElementById('MMSearchTBTextbox');
        try {
            if (oTB) oTB.popup.closePopup();
        }
        catch(e) {
            /*Seems to crash sometimes in autocomplete.xml, can't find the actual cause, only happened about 1/100 times...*/
        }
    },

    WSProHidePopups: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProHidePopups");
        if (this.bDisableHidePopups) return; //Used to allow middle click on Search Engines while leaving the popup open.
        var oPopup;

        oPopup = document.getElementById('contentAreaContextMenu');
        if (oPopup) oPopup.hidePopup();
        oPopup = document.getElementById('mmsearchpopupsearchengine');
        if (oPopup) oPopup.hidePopup();
        oPopup = document.getElementById('wspro-se-context');
        if (oPopup) oPopup.hidePopup();
    },

    WSProHandleContextGroupClick: function (event, sID) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProOverlay.WSProHandleContextGroupClick('" + sID + "')");
        if (event.button != 2 && event.target.id && event.target.id == sID) {
            event.stopPropagation();

            WSProOverlay.WSProHidePopups();
            WSProOverlay.MMPopupPreSearch(sID);
        }
    },

    WSProProcessSEContextPopup: function (oPopup, bShowing) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProProcessSEContextPopup");
        if (!this.oContextPopupNode || !this.oContextPopupNode.getAttribute('fseid')) {
            if (bShowing && document.popupNode && !document.popupNode.getAttribute('fseid')) return setTimeout(function () {document.getElementById("wspro-se-context").hidePopup();}, 1);
        }
        oPopup.setAttribute('showing', bShowing);
        if (!bShowing && this.oContextPopupNode) {
            oPopup = document.getElementById('contentAreaContextMenu');
            if (oPopup) oPopup.hidePopup();
            this.oContextPopupNode = null;
        }
    },

    WSProShowSEContextMenu: function (oEvent, oElement) {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProShowSEContextMenu");
        if (oEvent.button == 2) {
            oEvent.preventDefault();
            this.oContextPopupNode = oElement;
            document.getElementById('wspro-se-context').openPopup(oElement, "after_start", 0, 0, true, false);
        }
    },

    MMSearchHideDefaultFirefoxWebSearch: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("MMSearchHideDefaultFirefoxWebSearch");
        if (WSProOverlay.oUtils.GetBool("mmsearch-hidedefaultws") == true) {
            //Hide Default Firefox Web Search.
            var oElement;
            var oNavBar = document.getElementById("nav-bar");
            if (oNavBar.currentSet) {
                var sCurrentSet = oNavBar.currentSet;
                if (sCurrentSet.indexOf('search-container') >= 0) {
                    sCurrentSet = sCurrentSet.replace('search-container', '');
                    sCurrentSet = sCurrentSet.replace(',,', ',');
                    oNavBar.currentSet = sCurrentSet;
                    oNavBar.setAttribute("currentset", sCurrentSet);
                    document.persist("nav-bar", "currentset");
                    BrowserToolboxCustomizeDone(true);
                }
            }

            oElement = document.getElementById('context-searchselect');
            if (oElement) oElement.setAttribute('hidden', 'true');

            var oElements = document.getElementsByAttribute("command", "Tools:Search");
            var iIndex, iLen = oElements.length;

            for (iIndex = 0; iIndex < iLen; iIndex++) {
                oElement = oElements[iIndex];
                if (oElement) {
                    oElement.setAttribute('hidden', 'true');
                    oElement.setAttribute('command', '');
                    oElement = oElement.nextSibling;
                    if (oElement && oElement.localName == "menuseparator") oElement.setAttribute('hidden', 'true');
                }
            }
            if (document.getElementById('key_search')) document.getElementById('key_search').setAttribute('command', '');
            if (document.getElementById('key_search2')) document.getElementById('key_search2').setAttribute('command', '');
        }
    },

    WSProHideItems: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("WSProHideItems");

        var oItem;
        if (WSProOverlay.oUtils.GetBool("mmsearch-hidewsprotools") == true) {
            oItem = document.getElementById('mmsearchTools');
            if (oItem) oItem.setAttribute('hidden', 'true');
            oItem = document.getElementById('mmsearchToolsSeparator');
            if (oItem) {
                oItem.setAttribute('hidden', true);
                oItem = oItem.nextSibling;
                if (oItem && oItem.nodeName == "menuseparator" && oItem.id == "") oItem.setAttribute('hidden', 'true');
            }
        } else {
            oItem = document.getElementById('mmsearchToolsSeparator');
            if (WSProOverlay.oUtils.GetBool("mmsearch-hidedefaultws") == false) {
                if (oItem) oItem.setAttribute('hidden', true);
            }
        }
        if (WSProOverlay.oUtils.GetBool("mmsearch-hidewsprocontext") == true) {
            oItem = document.getElementById('mmsearch-context');
            if (oItem) oItem.setAttribute('hidden', 'true');
        }
        if (WSProOverlay.oUtils.GetBool("mmsearch-hidewsproresizer") == true) {
            oItem = document.getElementById('splitter_wsproresizer');
            if (oItem) oItem.setAttribute('hidden', 'true');
        }
        if (WSProOverlay.oUtils.GetBool("mmsearch-hidewsprostatusbar")) {
            oItem = document.getElementById('sbp-wspro-addengine');
            oItem.setAttribute('hidden', 'true');
        }
    },

    MMSearchGetSelectedText: function () {
        if (WSProOverlay.oUtils) WSProOverlay.oUtils.LogDebugMessage("MMSearchGetSelectedText");
        var sSelectedText = "";
        if (this.sCurrentSearchText != "") return WSProOverlay.oUtils.Alltrim(this.sCurrentSearchText);

        if (typeof(getBrowserSelection) == "function") {
            sSelectedText = getBrowserSelection(75);
            if (sSelectedText != "") return WSProOverlay.oUtils.Alltrim(sSelectedText);
        }

        if (window._content && window._content.getSelection() && window._content.getSelection() != "") {
            sSelectedText = window._content.getSelection();
        } else {
            if (!gContextMenu) {
                if (!sSelectedText || sSelectedText == "") {
                    var oFE = document.commandDispatcher.focusedElement;
                    if (oFE && oFE.value) sSelectedText = oFE.value.substring(oFE.selectionStart, oFE.selectionEnd);
                }
            } else if (gContextMenu.onTextInput) {
                var node = document.popupNode;
                if (node && node.value) sSelectedText = node.value.substring(node.selectionStart, node.selectionEnd);
            } else {
                if (gContextMenu.isTextSelected) {
                    var focusedwindow = document.commandDispatcher.focusedwindow;
                    if (focusedwindow == window) focusedwindow = window._content;
                    sSelectedText = focusedwindow.getSelection();
                } else if (gContextMenu.link) {
                    sSelectedText = gContextMenu.linkText();
                } else {
                    if (this.sWSProHoverText && this.sWSProHoverText != "" && this.iWSProHoverTextIndex && this.iWSProHoverTextIndex >= 0) {
                        this.sWSProHoverText = this.sWSProHoverText.replace(/\n/g, " ");
                        var iStart = this.sWSProHoverText.lastIndexOf(" ", this.iWSProHoverTextIndex) + 1;
                        sSelectedText = this.sWSProHoverText.substr(iStart);
                        var iEnd = sSelectedText.indexOf(" ");
                        if (iEnd < 0) iEnd = sSelectedText.length;
                        sSelectedText = sSelectedText.substr(0, iEnd);
                        sSelectedText = sSelectedText.replace(new RegExp("[.,!;'\":?\)\(]+", "gi"), "");
                        if (!sSelectedText) sSelectedText = "";
                    }
                }
            }
        }

        // Limit search string length to 75.
        if (sSelectedText.length >= 75) sSelectedText = sSelectedText.substr(0, 75);
        return WSProOverlay.oUtils.Alltrim(sSelectedText.toString());
    },

    WSProToggleDenD: function () {
        WSProOverlay.oUtils.SetBool("mmsearch-droptextanywhere", !WSProOverlay.oUtils.GetBool("mmsearch-droptextanywhere"));
        if (WSProOverlay.oUtils.GetBool("mmsearch-droptextanywhere")) {
            getBrowser().mPanelContainer.addEventListener('dragover', WSProOverlay.WSProDragOver, true);
            getBrowser().mPanelContainer.addEventListener('dragdrop', WSProOverlay.WSProDrop, true);
            getBrowser().mPanelContainer.addEventListener('drop', WSProOverlay.WSProDrop, true);
            getBrowser().mPanelContainer.addEventListener('dragexit', WSProOverlay.WSProDragDropExit, true);
        } else {
            getBrowser().mPanelContainer.removeEventListener('dragover', WSProOverlay.WSProDragOver, true);
            getBrowser().mPanelContainer.removeEventListener('dragdrop', WSProOverlay.WSProDrop, true);
            getBrowser().mPanelContainer.removeEventListener('drop', WSProOverlay.WSProDrop, true);
            getBrowser().mPanelContainer.removeEventListener('dragexit', WSProOverlay.WSProDragDropExit, true);
        }

        WSProOverlay.WSProUpdateToggleDenDButton();
    },

    WSProUpdateToggleDenDButton: function () {
        var oTBButton = document.getElementById('WSProTBToggleDenD');
        if (oTBButton) oTBButton.setAttribute('dendon', WSProOverlay.oUtils.GetBool("mmsearch-droptextanywhere"));
    },

    WSProExportpreferences: function () {
        WSProOverlay.oUtils.Exportpreferences();
    },

    WSProImportpreferences: function () {
        if (WSProOverlay.oUtils.Importpreferences()) {
            var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
            oObService.notifyObservers(this, "apply-settings", "OK");
        }
    },

    WSProUsePlusForSpaceChar: function (sFSEID) {
        if (!this.aPlusForSpaceCharFSEIDs) {
            var sPlusForSpaceCharFSEIDs = WSProOverlay.oUtils.GetString("mmsearch-useplusforspacechar");
            this.aPlusForSpaceCharFSEIDs = sPlusForSpaceCharFSEIDs.split(" ");
        }
        var iIndex, iLen = this.aPlusForSpaceCharFSEIDs.length;
        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (this.aPlusForSpaceCharFSEIDs[iIndex] == sFSEID) return true;
        }
        return false;
    },

    GetLocale: function () {
        var oPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("general.useragent.");

        try {
            return oPref.getComplexValue("locale", Components.interfaces.nsIPrefLocalizedString).data;
        }
        catch(e) {}
        return oPref.getCharPref("locale");
    },

    GetMenuStyle: function () {
        return WSProOverlay.oUtils.GetString("mmsearch-menustyle");
    },

    GetNextMenuStyler: function (sID) {
        oItems = document.getElementsByAttribute('menustyler', 'true');
        iLen = oItems.length;
        for (iIndex = 0; iIndex < iLen; iIndex++) {
            if (oItems[iIndex].getAttribute('id') == sID) {
                iIndex += 1;
                if (iIndex == iLen) return null;
                else return oItems[iIndex];
            }
        }
    },

    WSProEnableInstantApply: function (bEnable) {
        var oPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("browser.preferences.");
        oPref.setBoolPref("instantApply", bEnable)
    },

    WSProGetInstantApply: function () {
        var oPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("browser.preferences.");
        return oPref.getBoolPref("instantApply");
    },
};

window.addEventListener("load", WSProOverlay.MMSearchPreInit, true);
window.addEventListener("unload", WSProOverlay.MMSearchDeInit, false);
