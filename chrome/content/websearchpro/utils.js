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
function MMSearchUtils()
{
    this.Init();
}

MMSearchUtils.prototype=
{
    oPref:null,
    oStringBundle:null,
    sSystemGroups:null,

    Init:function()
    {
        var sbService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
        this.oStringBundle = sbService.createBundle("chrome://websearchpro/locale/websearchpro.properties");

        this.oPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        this.oPref = this.oPref.getBranch("extensions.mmsearch.");
        this.CheckDefaultPreferences();
        this.sSystemGroups = "busin,compu,educa,movie,music,newss,refer,shopp,other"; //User can't remove these.
        this.bDebugMode = this.GetBool("mmsearch-debugmode");
        this.GetVersion();
    },

    ReInitPrefs: function()
    {
        var oPS = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        oPS.savePrefFile(null);

        this.oPref = null;
        this.oPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        this.oPref = this.oPref.getBranch("extensions.mmsearch.");
    },

    TranslateString: function(sName, sVar1, sVar2, sVar3)
    {
        var sResult = "";
        if(this.oStringBundle)
        {
            sResult  = this.oStringBundle.GetStringFromName(sName);
            if (sVar1 || sVar1 == 0) sResult = sResult.replace(/%1/g, sVar1);
            if (sVar2 || sVar2 == 0) sResult = sResult.replace(/%2/g, sVar2);
            if (sVar3 || sVar3 == 0) sResult = sResult.replace(/%3/g, sVar3);
            sResult = sResult.replace(/\\/g, ''); //Temporary fix babelzilla escaping bug.
        }
        return sResult;
    },

    CheckDefaultPreferences: function()
    {
        var bCheckLinkAllFFSearchEngines = false;

        if (!this.HasUserValue("mmsearch-freesearchengines"))
        {
            var aDefaultFreeSearchEngines = new Array();
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "4050f_vWeb Search Pro - Search Enginesf_vhttp://websearchpro.captaincaveman.nl/?id=search_engines&subid=search&q=f_vcompuf_vpng";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "-2f_vallmusicf_vhttp://www.allmusic.com/search/artist/f_vmusicf_vhttp://www.allmusic.com/img/favicon.ico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "8f_vWikipedia (EN)f_vhttp://en.wikipedia.org/wiki/Special:Search?search=f_vreferf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "-1f_vIMDbf_vhttp://www.imdb.com/find?q=f_vmovief_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "-8f_vGooglef_vhttp://www.google.com/search?q=f_votherf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "-16f_vGoogle Maps Directionsf_vhttp://maps.google.com/maps?saddr={searchTerms From}&daddr={searchTerms To}f_vreferf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "-9f_vYahoo!f_vhttp://search.yahoo.com/search?p=f_votherf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "256f_vGoogle Mapsf_vhttp://maps.google.com/maps?q=f_vreferf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "368f_vYouTubef_vhttp://www.youtube.com/results?search=Search&search_query=f_vmovief_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "273f_vDownload.comf_vhttp://download.cnet.com/1770-20_4-0.html?query={searchTerms}&tag=srch&searchtype=downloadsf_vcompuf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "55f_vAsk.comf_vhttp://www.ask.com/web?q=f_votherf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "121f_vMerriam Webster Online Dictionaryf_vhttp://www.merriam-webster.com/dictionary/f_vreferf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "-10f_veBayf_vhttp://search.ebay.com/search/search.dll?satitle=f_vshoppf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "-11f_vAmazon.comf_vhttp://www.amazon.com/exec/obidos/external-search/?mode=blended&field-keywords=f_vshoppf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "82f_vGoogle Imagesf_vhttp://images.google.com/images?q=f_votherf_vico";
            aDefaultFreeSearchEngines[aDefaultFreeSearchEngines.length] = "32f_vDictionary.comf_vhttp://dictionary.reference.com/search?q=f_vreferf_vhttp://dictionary1.classic.reference.com/favicon.ico";

            this.SetLocalizedString("mmsearch-freesearchengines", aDefaultFreeSearchEngines.join("f_e"));
            bCheckLinkAllFFSearchEngines = true;
        }
        var iCurrentTime = new Date().getTime() / 60000;
        if (!this.HasUserValue("mmsearch-lastupdatedse")) this.SetInt("mmsearch-lastupdatedse", iCurrentTime);

        if (!this.HasUserValue("mmsearch-dropzones"))
        {
            var sDropZones = "";
            var sEngines = this.GetLocalizedString("mmsearch-freesearchengines");
            if (sEngines.indexOf('-8f_v') >= 0) sDropZones += 'd_z0d_v0d_v-8';
            if (sEngines.indexOf('-9f_v') >= 0) sDropZones += 'd_z1d_v0d_v-9';
            if (sEngines.indexOf('55f_v') >= 0) sDropZones += 'd_z2d_v0d_v55';
            if (sEngines.indexOf('82f_v') >= 0) sDropZones += 'd_z3d_v0d_v82';
            
            if (sEngines.indexOf('368f_v') >= 0) sDropZones += 'd_z0d_v1d_v368';
            if (sEngines.indexOf('-1f_v') >= 0) sDropZones += 'd_z1d_v1d_v-1';
            if (sEngines.indexOf('-2f_v') >= 0) sDropZones += 'd_z2d_v1d_v-2';
            
            if (sEngines.indexOf('8f_v') >= 0) sDropZones += 'd_z0d_v2d_v8';
            if (sEngines.indexOf('256f_v') >= 0) sDropZones += 'd_z1d_v2d_v256';
            if (sEngines.indexOf('121f_v') >= 0) sDropZones += 'd_z2d_v2d_v121';
            if (sEngines.indexOf('32f_v') >= 0) sDropZones += 'd_z3d_v2d_v32';
            
            if (sEngines.indexOf('-10f_v') >= 0) sDropZones += 'd_z0d_v3d_v-10';
            if (sEngines.indexOf('-11f_v') >= 0) sDropZones += 'd_z1d_v3d_v-11';
            if (sEngines.indexOf('273f_v') >= 0) sDropZones += 'd_z2d_v3d_v273';
            
            sDropZones = sDropZones.substr(3);
            this.SetString("mmsearch-dropzones", sDropZones);
        }

        if (!this.HasUserValue("mmsearch-linkedffsearchengines"))
        {
            this.SetString("mmsearch-linkedffsearchengines", "");
            var bCheckNotLinkedFFSearchEngines = false;
            if (bCheckLinkAllFFSearchEngines)
            {
                if (!this.WSProCheckLinkAllFFSearchEngines()) bCheckNotLinkedFFSearchEngines = true;
            } else {bCheckNotLinkedFFSearchEngines = true;}
            if (bCheckNotLinkedFFSearchEngines)
            {
                if ("nsIBrowserSearchService" in Components.interfaces)
                {
                    var oSS = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);
                    var oEngines = oSS.getEngines({});
                    var sNotLinked = "";
                    var iIndex, iLen = oEngines.length;
                    for (iIndex = 0; iIndex < iLen; iIndex ++)
                    {
                        if (iIndex > 0) sNotLinked += "l_e";
                        sNotLinked += oEngines[iIndex].wrappedJSObject._id;
                    }
                    this.SetString("mmsearch-notlinkedffsearchengines", sNotLinked);
                }
            }
        }
    },

    HasUserValue: function(sName)
    {
        return this.oPref.prefHasUserValue(sName);
    },

    GetString :function(sName)
    {
        try {return this.oPref.getCharPref(sName);}
        catch (e) {return "";}
    },

    SetString :function(sName, sValue)
    {
        this.oPref.setCharPref(sName, sValue);
    },

    GetBool :function(sName)
    {
        return this.oPref.getBoolPref(sName);
    },

    SetBool :function(sName, bValue)
    {
        this.oPref.setBoolPref(sName, bValue);
    },

    GetInt :function(sName)
    {
        try {return this.oPref.getIntPref(sName);}
        catch (e) {return 0;}
    },

    SetInt :function(sName, iValue)
    {
        this.oPref.setIntPref(sName, iValue);
    },

    GetLocalizedString: function(sName)
    {
        try {return this.oPref.getComplexValue(sName, Components.interfaces.nsIPrefLocalizedString).data;}
        catch (e) {}
        try {return this.oPref.getCharPref(sName);}
        catch (e) {return "";}
    },

    SetLocalizedString: function(sName, sData)
    {
        var oPLS = Components.classes["@mozilla.org/pref-localizedstring;1"].createInstance(Components.interfaces.nsIPrefLocalizedString);
        oPLS.data = sData;
        this.oPref.setComplexValue(sName, Components.interfaces.nsIPrefLocalizedString, oPLS);
    },

    WriteDebugMessage: function(aMsg)
    {
        var oConsole = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces["nsIConsoleService"]);
        oConsole.logStringMessage(aMsg);
    },

    LogDebugMessage: function(aMsg)
    {
        if (this.bDebugMode)
        {
            var iNow = new Date().getTime();
            var oConsole = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces["nsIConsoleService"]);
            oConsole.logStringMessage("*** Web Search Pro " + this.sCurrentVersion + " Debug ***\n" + iNow + ": " + aMsg);
        }
    },

    WSProFlattenFreeSearchGroups: function(aFreeSearchGroups)
    {
        var aTemp = new Array();
        var sResult = "";
        var iIndex, iLen = aFreeSearchGroups.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            aTemp[iIndex] = aFreeSearchGroups[iIndex].join('f_v');
        }
        sResult = aTemp.join('f_g');

        return sResult;
    },

    WSProFlattenFreeSearchEngines: function(aFreeSearchEngines)
    {
        var aTemp = new Array();
        var sResult = "";
        var iIndex, iLen = aFreeSearchEngines.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            aTemp[iIndex] = aFreeSearchEngines[iIndex].join('f_v');
        }
        sResult = aTemp.join('f_e');

        return sResult;
    },

    FindTopParent: function(oElement)
    {
        if (oElement.parentNode)
        {
            while (oElement.parentNode)
            {
                oElement = oElement.parentNode;
            }
        }
        return oElement;
    },

    FindPosX: function(oElement)
    {
        var iX = 0;
        if (oElement.offsetParent)
        {
            while (oElement.offsetParent)
            {
                iX += oElement.offsetLeft;
                oElement = oElement.offsetParent;
            }
        }
        else if (oElement.boxObject.screenX) iX = oElement.boxObject.screenX;
        return iX;
    },

    FindPosY: function(oElement)
    {
        var iY = 0;
        if (oElement.offsetParent)
        {
            while (oElement.offsetParent)
            {
                iY += oElement.offsetTop;
                oElement = oElement.offsetParent;
            }
        }
        else if (oElement.boxObject.screenY) iY = oElement.boxObject.screenY;
        return iY;
    },

    GetHostFromURI: function(sURI)
    {
        var sHost = sURI;

        try
        {
            var oIOS = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
               var oURI = oIOS.newURI(sURI,null,null);
            oURI.spec = sURI;
            sHost = oURI.host;
        } catch (e) {}

        return sHost;
    },

    GetDomainFromURI: function(sURI)
    {
        var sDomain = sURI;

        try
        {
            var oIOS = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
               var oURI = oIOS.newURI(sURI,null,null);
            oURI.spec = sURI;
            sDomain = oURI.scheme + "://" + oURI.host + "/";
        } catch (e) {}

        return sDomain;
    },

    GetFaviconURI: function(sSearchEngineURI, sFavIconType)
    {
        if (sFavIconType == "") return "";
        if (sSearchEngineURI.indexOf('http://') == -1 && sSearchEngineURI.indexOf('https://') == -1) sSearchEngineURI = 'http://' + sSearchEngineURI;
        try
        {
            var oIOS = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
            var oURI = oIOS.newURI(sSearchEngineURI,null,null);

            oURI.spec = sSearchEngineURI;

            return oURI.scheme + "://" + oURI.host + "/favicon." + sFavIconType;
        }
        catch (e) {return "";}
        return "";
    },

    GetFavIconFromTab: function(sURI)
    {
        var sFavIcon = "";
        if(gBrowser.selectedBrowser.currentURI.spec == sURI)
        {
            if(gBrowser.selectedTab.hasAttribute("image")) sFavIcon = gBrowser.selectedTab.getAttribute("image");
        }
        else
        {
            var oBrowsers = getBrowser().browsers;
            if (!oBrowsers || oBrowsers.length == 0) oBrowsers = new Array(getBrowser());
            var iIndex, iLen = oBrowsers.length;
            for(iIndex = 0; iIndex < iLen; iIndex++)
            {
                if(oBrowsers[iIndex].currentURI.spec == sURI)
                {
                    if(getBrowser().tabs[iIndex].getAttribute("image") != "")
                    {
                        sFavIcon = getBrowser().tabs[iIndex].getAttribute("image");
                        break;
                    }
                }
            }
        }
        return sFavIcon;
    },

    Alltrim: function(sText)
    {
        while (sText.charAt(0) == ' ' || sText.charCodeAt(0) == 13 || sText.charCodeAt(0) == 10 || sText.charCodeAt(0) == 9) sText = sText.substring(1);
        while (sText.charAt(sText.length-1) == ' ' || sText.charCodeAt(sText.length-1) == 13 || sText.charCodeAt(sText.length-1) == 10 || sText.charCodeAt(sText.length-1) == 9) sText = sText.substring(0, sText.length-1);
        return sText;
    },

    PadLeft: function(sString,iLength,sPadChar)
    {
        var iIndex, iPLen, iSLen;

        sString = sString.toString();
        iSLen = sString.length;
        if(iLength <= iSLen) return sString;
        iPLen = iLength - iSLen;
        for(iIndex = 0; iIndex < iPLen; iIndex++) sString = sPadChar + sString;
        return sString;
    },

    RemoveAllChildren: function(oItem, sDontRemoveIDs)
    {
        if (!oItem) return;
        
        var sID;
        var iIndex, iLen;

        iLen = oItem.childNodes.length - 1;

        for (iIndex = iLen; iIndex >= 0; iIndex --)
        {
            sID = oItem.childNodes[iIndex].id;
            if ((!sDontRemoveIDs || sDontRemoveIDs.indexOf(sID) == -1) && sID && sID != "")
            {
                oItem.removeChild(oItem.childNodes[iIndex]);
            }
            else
            {
                if (oItem.childNodes[iIndex].childNodes.length > 0) this.RemoveAllChildren(oItem.childNodes[iIndex], sDontRemoveIDs)
            }
        }
    },

    GetTopContentWindow: function()
    {
        return window.top.getBrowser().browsers[window.top.getBrowser().mTabBox.selectedIndex].contentWindow;
    },

    GetTopContentDocument: function()
    {
        return window.top.getBrowser().browsers[window.top.getBrowser().mTabBox.selectedIndex].contentDocument;
    },

    GetIndex: function(aArray, sItem)
    {
        var iIndex, iLen = aArray.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            if (aArray[iIndex][0] == sItem) return iIndex;
        }
        return -1;
    },

    GetVersion: function()
    {
        try
        {
            var oEM = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
            if (oEM.getItemForID) {
                this.SetVersion(oEM.getItemForID("{8B8A525A-CFCA-44cf-81C3-3969E6CB96E0}").version);
                return this.sCurrentVersion;
            }
            else {
                this.SetVersion(oEM.getItemList("{8B8A525A-CFCA-44cf-81C3-3969E6CB96E0}", null, {})[0].version);
                return this.sCurrentVersion;
            }
        }
        catch (e)
        {
            Components.utils.import("resource://gre/modules/AddonManager.jsm");
            var oUtils = this;
            AddonManager.getAddonByID("{8B8A525A-CFCA-44cf-81C3-3969E6CB96E0}", function(oAddon) {
                oUtils.SetVersion(oAddon.version);
            });
            return this.sCurrentVersion; //Stupid async calls... Just hope it's already there...
        }
    },
    
    SetVersion: function(sVersion)
    {
        this.sCurrentVersion = sVersion;

        var sPrevVersion = this.GetString("mmsearch-showedwebsiteforversion");

        if (this.sCurrentVersion && this.sCurrentVersion != "" && sPrevVersion != this.sCurrentVersion)
        {
            this.LoadSearchEnginesPage();
            this.SetString("mmsearch-showedwebsiteforversion", this.sCurrentVersion);
        }        
    },
    
    LoadSearchEnginesPage: function()
    {
        var oBrowser = getBrowser();
        if (oBrowser && typeof(oBrowser.addTab) == "function") oBrowser.selectedTab = oBrowser.addTab(this.GetString("mmsearch-freesearchenginesurl"));
    },
    

    GetWSPRoSearchPluginsDir: function()
    {
        var oProperties = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);

        var sWSPRoSearchPluginsDir = oProperties.get("ProfD", Components.interfaces.nsIFile).path + "\\searchplugins\\wspro\\";
        var oWSPRoSearchPluginsDir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        oWSPRoSearchPluginsDir.initWithPath(sWSPRoSearchPluginsDir);
        if (!oWSPRoSearchPluginsDir.exists()) {oWSPRoSearchPluginsDir.create(1, 8);}

        return sWSPRoSearchPluginsDir;
    },
    
    GetContrastTextColor: function(sHexRGB)
    {
        var iR = parseInt(sHexRGB.substr(1,2));
        var iG = parseInt(sHexRGB.substr(3,2));
        var iB = parseInt(sHexRGB.substr(5,2));

        var iBackY = ((iR * 299) + (iG * 587) + (iB * 114)) / 1000;
        var iTextY = ((0 * 299) + (0 * 587) + (0 * 114)) / 1000;

        var iBDiff = Math.abs(iBackY - iTextY);
        var iCDiff = iR + iG + iB;
        
        if (iBDiff < 175 && iCDiff <= 350) return "rgb(255,255,255)"        
        return "rgb(0,0,0)"        
    },

    DownloadFavicon: function(sLocalFileName, sRemoteFileName)
    {
        var oIOService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService)
        var sWSPRoSearchPluginsDir = this.GetWSPRoSearchPluginsDir()

        var oLocalICOFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        oLocalICOFile.initWithPath(sWSPRoSearchPluginsDir + sLocalFileName);

        var oWSProDownloadObserver = {onDownloadComplete: function(nsIDownloader, nsresult, oFile) {}};

        var oDownloader = Components.classes["@mozilla.org/network/downloader;1"].createInstance();
        oDownloader.QueryInterface(Components.interfaces.nsIDownloader);
        oDownloader.init(oWSProDownloadObserver, oLocalICOFile);

        var oHttpChannel = oIOService.newChannel(sRemoteFileName, "", null);
        oHttpChannel.QueryInterface(Components.interfaces.nsIHttpChannel);
        oHttpChannel.asyncOpen(oDownloader, oLocalICOFile);
    },

    Image2B64: function(sFileName)
    {
        var oFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        var oStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
        var oBIStream = Components.classes['@mozilla.org/binaryinputstream;1'].createInstance(Components.interfaces.nsIBinaryInputStream);

        oFile.initWithPath(this.URI2Path(sFileName));
        oStream.init(oFile, 0x01, 0444, null);
        oBIStream.setInputStream(oStream);
        var sData = oBIStream.readBytes(oBIStream.available());
        oBIStream.close();
        return window.btoa(sData);
    },

    RemoteImage2B64: function(sFavIconURI, oCanvas)
    {
        if (sFavIconURI && sFavIconURI != "")
        {
            try
            {
                var oImage = new Image();
                oImage.src = sFavIconURI;
                if (!oCanvas) oCanvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
                oCanvas.width = 16;
                oCanvas.height = 16;
                var oContext = oCanvas.getContext('2d');
                oContext.drawImage(oImage, 0, 0, 16, 16);
                var sDataURL = oCanvas.toDataURL();
                return sDataURL;
            }
            catch (e) {return this.OlderFirefoxRemoteImage2B64(sFavIconURI);}
        }
        return "";
    },

    OlderFirefoxRemoteImage2B64: function(sFavIconURI)
    {
        var oFFPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        oFFPref = oFFPref.getBranch("dom.");
        var iOrgTime = oFFPref.getIntPref("max_script_run_time");
        if (!iOrgTime || iOrgTime <= 0) iOrgTime = 10
        oFFPref.setIntPref("max_script_run_time", 999);

        var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
        var oChannel = ioService.newChannelFromURI(ioService.newURI(sFavIconURI, null, null));
        var bStream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
        bStream.setInputStream(oChannel.open());
        var bytes = [];
        while (bStream.available() != 0) bytes = bytes.concat(bStream.readByteArray(bStream.available()));
        bStream.close();
        var sB64Data = 'data:image/x-icon;base64,' + this.FFb64(bytes);
        oFFPref.setIntPref("max_script_run_time", iOrgTime);
        return sB64Data;
    },

    //From Mozilla Firefox nsSearchService.js
    FFb64: function(aBytes)
    {
        const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var out = "", bits, i, j;

        while (aBytes.length >= 3)
        {
            bits = 0;
            for (i = 0; i < 3; i++)
            {
                bits <<= 8;
                bits |= aBytes[i];
            }
            for (j = 18; j >= 0; j -= 6) out += B64_CHARS[(bits>>j) & 0x3F];

            aBytes.splice(0, 3);
        }

        switch (aBytes.length)
        {
            case 2:
                out += B64_CHARS[(aBytes[0]>>2) & 0x3F];
                out += B64_CHARS[((aBytes[0] & 0x03) << 4) | ((aBytes[1] >> 4) & 0x0F)];
                out += B64_CHARS[((aBytes[1] & 0x0F) << 2)];
                out += "=";
                break;
            case 1:
                out += B64_CHARS[(aBytes[0]>>2) & 0x3F];
                out += B64_CHARS[(aBytes[0] & 0x03) << 4];
                out += "==";
            break;
        }
        return out;
    },

    B642Image: function(sB64Data, oImageDir, sFileName)
    {
        var oFile;
        var oStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
        var sData = window.atob(sB64Data);

        oFile = oImageDir.clone();
        oFile.append(sFileName);
        oStream.init(oFile, 0x20|0x02|0x08, 0666, 0);
        oStream.write(sData, sData.length);
        oStream.close();

        var oPHandler = Components.classes['@mozilla.org/network/protocol;1?name=file'].createInstance(Components.interfaces.nsIFileProtocolHandler);
        return oPHandler.getURLSpecFromFile(oFile);
    },

    LocalFileExists: function(sFileName)
    {
        var oFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        oFile.initWithPath(sFileName);
        return oFile.exists();
    },

    URI2Path: function(sURI)
    {
        var oFPHandler = Components.classes["@mozilla.org/network/protocol;1?name=file"].createInstance(Components.interfaces.nsIFileProtocolHandler);
        return oFPHandler.getFileFromURLSpec(sURI).path;
    },

    WSProArrayCompareAsc: function(a1, a2)
    {
        if (a1[1].toUpperCase() < a2[1].toUpperCase()) return -1;
        return 1;
    },

    WSProArrayCompareDesc: function(a1, a2)
    {
        if (a1[1].toUpperCase() > a2[1].toUpperCase()) return -1;
        return 1;
    },

    WSProCheckLinkAllFFSearchEngines: function()
    {
        if ("nsIBrowserSearchService" in Components.interfaces)
        {
            var oSS = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);
            var oEngines = oSS.getVisibleEngines({});
            var aWSProEngine;
            var sLinks = "", sSearchEngines = "";
            var sDropZones = "";
            var iIndex, iLen = oEngines.length;
            var iX = 0; iY = 0;

            if (iLen > 7) //More engines selected than the default 7
            {
                for (iIndex = 0; iIndex < iLen; iIndex ++)
                {
                    aWSProEngine = this.WSProFFSearchEngine2WSPro(oEngines[iIndex]);

                    if (iIndex > 0) sLinks += "l_e";
                    sLinks += oEngines[iIndex].wrappedJSObject._id + "l_v" + aWSProEngine[0];

                    if (iIndex > 0) sSearchEngines += "f_e";
                    sSearchEngines += aWSProEngine[0] + "f_v" + aWSProEngine[1] + "f_v" + aWSProEngine[2] + "f_v" + aWSProEngine[3] + "f_v" + aWSProEngine[4];
                    if (iIndex <= 64)
                    {
                        //Initialize DropZones.
                        sDropZones += 'd_z' + iX + 'd_v' + iY + 'd_v' + aWSProEngine[0];
                        iX++;
                        if (iX > 6)
                        {
                            iX = 0;
                            iY++;
                        }
                        if (iY > 6) iY = 0;
                    }
                }
                this.SetString("mmsearch-shortcutkeys", ""); //Leave empty
                sDropZones = sDropZones.substr(3);
                this.SetLocalizedString("mmsearch-dropzones", sDropZones);

                this.SetString("mmsearch-linkedffsearchengines", sLinks);
                this.SetLocalizedString("mmsearch-freesearchengines", sSearchEngines);
                return true;
            }
        }
        return false;
    },

    WSProFFSearchEngine2WSPro: function(oEngine, bDontCreateID)
    {
        var oURI;
        var sFSEID = "", sLabel, sFavIcon = "", sURI, sType = "other";
        var iPIndex, iPLen;

        try
        {
            sLabel = oEngine.wrappedJSObject._name;
            oURI = oEngine.wrappedJSObject._getURLOfType("text/html");
            sURI = oURI.template;
            if (sURI.indexOf("?") < 0) sURI += "?";
            iPLen = oURI.params.length;
            for (iPIndex = 0; iPIndex < iPLen; iPIndex ++)
            {
                if (iPIndex > 0) sURI += "&";
                if (oURI.params[iPIndex].name == "sourceid") {sURI += oURI.params[iPIndex].name + "=captaincaveman";}
                else {sURI += oURI.params[iPIndex].name + "=" + oURI.params[iPIndex].value;}
            }
            if (sURI.toLowerCase().indexOf("sourceid=mozilla-search") >= 0) sURI = sURI.replace(/sourceid=mozilla-search/i, "sourceid=captaincaveman");
            if (oEngine.wrappedJSObject.iconURI) sFavIcon = oEngine.wrappedJSObject.iconURI.spec;
            if (!bDontCreateID) sFSEID = this.WSProGetNewFFSELinkID(); //Get the new ID last, so we don't inc it on failed engines...
            return [sFSEID, sLabel, sURI, sType, sFavIcon];
        }
        catch (e) {return ["Error: " + e.toString()];}
    },

    WSProRemoveLinkedFFSE: function(sFSEID)
    {
        var aFFSEs = this.WSProGetLinkedFFSEArray();
        var iIndex = this.WSProGetLinkedFFSEIndex(aFFSEs, "", sFSEID);

        if (iIndex == -1) return false;

        aFFSEs.splice(iIndex, 1);
        this.SetString("mmsearch-linkedffsearchengines", this.WSProFlattenLinkedFFSEs(aFFSEs));
        return true;
    },

    WSProGetLinkedFFSEIndex: function(aFFSEs, sFFID, sFSEID)
    {
        var iIndex, iLen = aFFSEs.length;
        var iSubIndex = 0;
        var sID = sFFID;

        if (!sFFID || sFFID == "")
        {
            iSubIndex = 1;
            sID = sFSEID;
        }

        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            if (aFFSEs[iIndex][iSubIndex] == sID) return iIndex;
        }
        return -1;
    },

    WSProGetNotLinkedFFSEIndex: function(aFFSEs, sFFID)
    {
        var iIndex, iLen = aFFSEs.length;

        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            if (aFFSEs[iIndex] == sFFID) return iIndex;
        }
        return -1;
    },

    WSProGetLinkedFFSEArray: function()
    {
        var aTmp = this.GetString("mmsearch-linkedffsearchengines").split('l_e');
        var aFFSEs = new Array();
        var iIndex, iLen = aTmp.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++) aFFSEs[iIndex] = aTmp[iIndex].split('l_v');
        return aFFSEs;
    },

    WSProGetNotLinkedFFSEArray: function()
    {
        return this.GetString("mmsearch-notlinkedffsearchengines").split('l_e');
    },

    WSProFlattenLinkedFFSEs: function(aFFSEs)
    {
        var aTemp = new Array();
        var sResult = "";
        var iIndex, iLen = aFFSEs.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            aTemp[iIndex] = aFFSEs[iIndex].join('l_v');
        }
        sResult = aTemp.join('l_e');

        return sResult;
    },

    WSProGetNewFFSELinkID: function()
    {
        var sID = 'f' + (parseInt(this.GetString("mmsearch-linkedffsearchenginesid").replace('f', ''), 10) + 1);
        this.SetString("mmsearch-linkedffsearchenginesid", sID);
        return sID;
    },

    Exportpreferences: function()
    {
        var dToday = new Date();
        var sFileName = dToday.getFullYear().toString() + this.PadLeft((dToday.getMonth() + 1).toString(), 2, '0') + this.PadLeft(dToday.getDate().toString(), 2, '0') + ".wspro.txt";
        var oFP = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);

        oFP.init(window, this.TranslateString('wspro-settings-export'), oFP.modeSave);
        oFP.defaultExtension = "txt";
        oFP.defaultString = sFileName;
        oFP.appendFilters(oFP.filterText);
        oFP.appendFilters(oFP.filterAll);

        var iResult = oFP.show();
        if (iResult == oFP.returnOK || iResult == oFP.returnReplace)
        {
            var sText = "Web Search Pro settings version " + this.GetVersion() + "\r\n";
            var sValue = "";
            var iIndex, iLen = {value:0};
            var aPrefs = this.oPref.getChildList("" , iLen);
            for each(var aPref in aPrefs)
            {
                switch (this.oPref.getPrefType(aPref))
                {
                    case this.oPref.PREF_STRING:
                        if (aPref == "mmsearch-freesearchgroups" || aPref == "mmsearch-freesearchengines")
                        {
                            sValue = this.GetLocalizedString(aPref);
                        }
                        else
                        {
                            sValue = this.GetString(aPref);
                        }
                        sText += 'STRINGf_p' + aPref + 'f_p' + sValue;
                        break;
                    case this.oPref.PREF_INT:
                        sText += 'INTf_p' + aPref + 'f_p' + this.oPref.getIntPref(aPref);
                        break;
                    case this.oPref.PREF_BOOL:
                        sText += 'BOOLf_p' + aPref + 'f_p' + this.oPref.getBoolPref(aPref);
                        break;
                }
                sText += "\r\n";
            }
            var oStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
            oStream.init(oFP.file, 0x20|0x02|0x08, 0666, 0);

            var oCOS = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
            oCOS.init(oStream, "UTF-8", 0, oCOS.DEFAULT_REPLACEMENT_CHARACTER);
            oCOS.writeString(sText);
            oCOS.flush();
            oCOS.close();

            return true;
        }
        return false;
    },

    WSProGetSEStats: function()
    {
        var aTemp = this.GetString("mmsearch-sestats").split('s_e');
        var aStats = new Array();
        var iIndex, iLen = aTemp.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            if (aTemp[iIndex] && aTemp[iIndex] != "" && aTemp[iIndex] != "s_v")
            {
                aStats[aStats.length] = aTemp[iIndex].split('s_v');
            }
        }
        return aStats;
    },

    WSProFlattenSEStats: function(aStats)
    {
        var aTemp = new Array();
        var sResult = "";
        var iIndex, iLen = aStats.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            aTemp[iIndex] = aStats[iIndex].join('s_v');
        }
        sResult = aTemp.join('s_e');

        return sResult;
    },

    WSProGetSEStat: function(sFSEID)
    {
        var aStats = this.WSProGetSEStats();
        var iIndex, iLen = aStats.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            if (aStats[iIndex][0] == sFSEID) return iIndex;
        }
        return -1;
    },

    WSProAddSEStat: function(sFSEID)
    {
        var aStats = this.WSProGetSEStats();
        var iIndex = this.WSProGetSEStat(sFSEID);
        if (iIndex == -1)
        {
            iIndex = aStats.length;
            aStats[iIndex] = new Array(sFSEID, 0);
        }
        aStats[iIndex][1] ++;

        this.SetString("mmsearch-sestats", this.WSProFlattenSEStats(aStats));
    },

    WSProGetSEStatRGBValue: function(sFSEID)
    {
        var iMax = this.WSProGetMaxSEStat();
        if (iMax < 5) return 0; //Not enough data...
        if (this.WSProGetTotalSEStat() < 20) return 0; //Not enough data...

        var aStats = this.WSProGetSEStats();
        var iSEIndex = this.WSProGetSEStat(sFSEID);
        if (iSEIndex == -1) return 124;

        var iPerc = 0;
        iPerc = (aStats[iSEIndex][1] / iMax);
        var iResult = parseInt(124 - (124 * iPerc));
        
        return iResult;
    },

    WSProGetMaxSEStat: function()
    {
        var aStats = this.WSProGetSEStats();
        var iIndex, iLen = aStats.length;
        var iMax = 0;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            if (parseInt(aStats[iIndex][1]) > iMax) iMax = aStats[iIndex][1];
        }
        return iMax;
    },

    WSProGetTotalSEStat: function()
    {
        var aStats = this.WSProGetSEStats();
        var iIndex, iLen = aStats.length;
        var iTotal = 0;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            iTotal = iTotal + parseInt(aStats[iIndex][1]);
        }
        return iTotal;
    },

    WSProGetSEStatCount: function(sFSEID)
    {
        var aStats = this.WSProGetSEStats();
        var iSEIndex = this.WSProGetSEStat(sFSEID);
        if (iSEIndex == -1) return 0;
        return aStats[iSEIndex][1];
    },
    
    GenerateID: function()
    {
        return ((((1+Math.random())*0x10000)|0).toString(16).substring(1) + (((1+Math.random())*0x10000)|0).toString(16).substring(1)).toUpperCase();
    },


    Importpreferences: function()
    {
        var dToday = new Date();
        var sFileName = dToday.getFullYear().toString() + dToday.getMonth().toString() + dToday.getDate().toString() + ".wspro.txt";
        var oFP = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
        var sText = "";

        oFP.init(window, this.TranslateString('wspro-settings-import'), oFP.modeOpen);
        oFP.defaultExtension = "txt";
        oFP.defaultString = sFileName;
        oFP.appendFilters(oFP.filterText);
        oFP.appendFilters(oFP.filterAll);

        if (oFP.show() == oFP.returnOK)
        {
            var oStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);

            oStream.init(oFP.file, 0x01, 0444, null);

            var oCIS = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
            oCIS.init(oStream, "UTF-8", 0, Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
            var oText = {};
            while (oCIS.readString(4096, oText) != 0) {sText += oText.value;}
            oCIS.close();

            var aLines = sText.split("\r\n");
            var aLine;
            var iIndex, iLen = aLines.length;
            var sVersion = aLines[0].replace("Web Search Pro settings version ", ""); //Do nothing with this for now...
            var bValue = true;

            for (iIndex = 1; iIndex < iLen; iIndex ++)
            {
                if (aLines[iIndex] && aLines[iIndex] != "")
                {
                    aLine = aLines[iIndex].split("f_p");
                    switch (aLine[0])
                    {
                        case "STRING":
                            if (aLine[1] == "mmsearch-freesearchgroups" || aLine[1] == "mmsearch-freesearchengines")
                            {
                                this.SetLocalizedString(aLine[1], aLine[2]);
                            }
                            else
                            {
                                this.SetString(aLine[1], aLine[2]);
                            }
                            break;
                        case "BOOL":
                            bValue = /true/i.test(aLine[2]);
                            this.SetBool(aLine[1], bValue);
                            break;
                        case "INT":
                            this.SetInt(aLine[1], parseInt(aLine[2]));
                            break;
                    }
                }
            }

            var oPS = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
            oPS.savePrefFile(null);

            return true;
        }

        return false;
    }
};
