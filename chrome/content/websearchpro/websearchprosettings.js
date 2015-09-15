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
const WSProDragDropItemObserver =
{ 
	onDragStart: function (evt,transferData,action)
	{
		var sData = evt.target.parentNode.getAttribute("fseid");
		transferData.data = new TransferData();
		transferData.data.addDataForFlavour("text/unicode", sData);
	}
};

const WSProDragDropObserver =
{
	getSupportedFlavours : function ()
	{
		var oFS = new FlavourSet();
		oFS.appendFlavour("text/unicode");
		return oFS;
	},
	
	onDragOver: function (evt,flavour,session)
	{
		var oElements;
		var oElement, oSource;
		var sSourceRowType, sDestRowType;
		var iIndex, iLen;
		
		for (iIndex = 0; iIndex < iLen; iIndex ++) {oElements[iIndex].setAttribute("dragingover", false);}
				
		oElement = evt.target;
		oSource = session.sourceNode;
		if (oElement.className != "overviewrow") oElement = evt.target.parentNode;
		if (oSource.className != "overviewrow") oSource = oSource.parentNode;

		sSourceRowType = oSource.getAttribute('rowtype');
		sDestRowType = oElement.getAttribute('rowtype');
		
		if ((sSourceRowType == "searchengine" && sDestRowType == "searchengine") || (sSourceRowType == "searchengine" && sDestRowType == "searchgroup") || (sSourceRowType == "searchgroup" && sDestRowType == "searchgroup"))
		{
			session.canDrop = true;
		}
		else
		{
			session.canDrop = false;
			return session.canDrop;
		}


		if (oElement.nextSibling && oElement.nextSibling.className == 'overviewrow') {oElement.setAttribute("dragstate", "top");}
		else
		{
			var iMid = oElement.boxObject.screenY + (oElement.boxObject.height / 2);
			var iMouse = (evt.screenY);
			if (iMouse < iMid) {oElement.setAttribute("dragstate", "top");}
			else {oElement.setAttribute("dragstate", "bottom");}
		}

		oElements = document.getElementsByAttribute("dragstate", "top");
		iLen = oElements.length;
		for (iIndex = 0; iIndex < iLen; iIndex ++) {if (oElements[iIndex]&& oElements[iIndex].id != oElement.id) oElements[iIndex].setAttribute("dragstate", "");}
		oElements = document.getElementsByAttribute("dragstate", "bottom");
		iLen = oElements.length;
		for (iIndex = 0; iIndex < iLen; iIndex ++) {if (oElements[iIndex]&& oElements[iIndex].id != oElement.id) oElements[iIndex].setAttribute("dragstate", "");}

		WSProEnsureElementIsVisible(oElement);
	},
	
	onDrop: function (evt,dropdata,session)
	{
		var oElements;
		var oElement, oSource;
		var sDroppedFSEID;
		var sTargetFSEID;
		var sSourceRowType, sDestRowType;
		var iIndex, iLen;
		
		for (iIndex = 0; iIndex < iLen; iIndex ++) {oElements[iIndex].setAttribute("dragingover", false);}
		
		sDroppedFSEID = dropdata.data;

		oElement = evt.target;
		oSource = session.sourceNode;
		if (oElement.className != "overviewrow") oElement = evt.target.parentNode;
		if (oSource.className != "overviewrow") oSource = oSource.parentNode;

		sSourceRowType = oSource.getAttribute('rowtype');
		sDestRowType = oElement.getAttribute('rowtype');
		
		sTargetFSEID = oElement.getAttribute('fseid');
		if (oElement.getAttribute("dragstate") != "top") sTargetFSEID = "_after_" + sTargetFSEID;

		oElements = document.getElementsByAttribute("dragstate", "top");
		iLen = oElements.length;
		for (iIndex = 0; iIndex < iLen; iIndex ++) {oElements[iIndex].setAttribute("dragstate", "");}
		oElements = document.getElementsByAttribute("dragstate", "bottom");
		iLen = oElements.length;
		for (iIndex = 0; iIndex < iLen; iIndex ++) {oElements[iIndex].setAttribute("dragstate", "");}


		if (sSourceRowType == "searchengine" && sDestRowType == "searchengine") WSProDragMoveSE(sDroppedFSEID, sTargetFSEID);
		if (sSourceRowType == "searchengine" && sDestRowType == "searchgroup") WSProDragMoveSEType(sDroppedFSEID, sTargetFSEID);
		if (sSourceRowType == "searchgroup" && sDestRowType == "searchgroup") WSProDragMoveSG(sDroppedFSEID, sTargetFSEID);
	}
};

const WSProDropZoneDragDropItemObserver =
{ 
	onDragStart: function (evt,transferData,action)
	{
		var oDZ = evt.target;
		if (oDZ.getAttribute('class') != "dropzone_small") oDZ = oDZ.parentNode;
		var sData = oDZ.getAttribute("id");
		oDZ.setAttribute('dragstate', '1');
		transferData.data = new TransferData();
		transferData.data.addDataForFlavour("text/unicode", sData);
	}
};

const WSProDropZoneDragDropObserver =
{
	getSupportedFlavours : function ()
	{
		var oFS = new FlavourSet();
		oFS.appendFlavour("text/unicode");
		return oFS;
	},
	
	onDragOver: function (evt,flavour,session)
	{
		var oDZs = document.getElementsByAttribute('class', 'dropzone_small');
		var oDZ;
		var iIndex, iLen = oDZs.length;
		
		for (iIndex = 0; iIndex < iLen; iIndex ++) {oDZs[iIndex].setAttribute('dragstate', '');}
		
		oDZ = session.sourceNode;
		if (oDZ.getAttribute('class') != "dropzone_small") oDZ = oDZ.parentNode;		
		oDZ.setAttribute('dragstate', '1');
		
		oDZ = evt.originalTarget;
		if (oDZ.getAttribute('class') != "dropzone_small") oDZ = oDZ.parentNode;		
		oDZ.setAttribute('dragstate', '2');

		session.canDrop = true;
		return session.canDrop;
	},
	
	onDrop: function (evt,dropdata,session)
	{
		var oDZs = document.getElementsByAttribute('class', 'dropzone_small');
		var oDZ;
		var sDroppedID;
		var sTargetID;
		var iIndex, iLen = oDZs.length;
		
		sDroppedID = dropdata.data;
        
		oDZ = evt.target;
		if (oDZ.getAttribute('class') != "dropzone_small") oDZ = oDZ.parentNode;		
		sTargetID = oDZ.getAttribute('id');

		WSProDragSwitchDropZone(sDroppedID, sTargetID);

		for (iIndex = 0; iIndex < iLen; iIndex ++) {oDZs[iIndex].setAttribute('dragstate', '');}
	}
};

function WSProDragOver(oEvent)
{
	nsDragAndDrop.dragOver(oEvent, WSProDragDropObserver);	
}

function WSProDrop(oEvent)
{
	nsDragAndDrop.drop(oEvent, WSProDragDropObserver);	
}

function WSProDropZoneDragOver(oEvent)
{
	nsDragAndDrop.dragOver(oEvent, WSProDropZoneDragDropObserver);	
}

function WSProDropZoneDrop(oEvent)
{
	nsDragAndDrop.drop(oEvent, WSProDropZoneDragDropObserver);	
}

function InitWindow()
{
	if (!this.SEObserver)
	{
		this.SEObserver =
		{
			observe: function(subject, topic, state)
			{
				if (topic == "apply-se" || topic == "new-searchengine") if (this && typeof(WSProInitShortcuts) == "function")
				{
					WSProInitShortcuts();
					WSProInitFreeSearchEngines();
					WSProInitFreeSearchGroups();
					WSProInitDropZones();
				}
			}
		}
		var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService)
		oObService.addObserver(this.SEObserver, "apply-se", false); 
		oObService.addObserver(this.SEObserver, "new-searchengine", false); 
	}

	//Init utils.
	if (window.arguments && window.arguments.length > 0) this.oUtils = window.arguments[0].oUtils;
	else this.oUtils = new MMSearchUtils();

    var oAppInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
    var sGeckoVersion = oAppInfo.platformVersion;
    var iCompare = Components.classes["@mozilla.org/xpcom/version-comparator;1"].getService(Components.interfaces.nsIVersionComparator).compare(sGeckoVersion, '1.9.1');

	document.getElementById("vbox_selectedengines").firstChild.addEventListener('dragover', WSProDragOver, false);
	if (iCompare < 0) document.getElementById("vbox_selectedengines").firstChild.addEventListener('dragdrop', WSProDrop, false);
    document.getElementById("vbox_selectedengines").firstChild.addEventListener('drop', WSProDrop, false);
	document.getElementById("vbox_searchenginegroups").firstChild.addEventListener('dragover', WSProDragOver, false);
	if (iCompare < 0) document.getElementById("vbox_searchenginegroups").firstChild.addEventListener('dragdrop', WSProDrop, false);
    document.getElementById("vbox_searchenginegroups").firstChild.addEventListener('drop', WSProDrop, false);

	document.getElementById("dropzonebox").addEventListener('dragover', WSProDropZoneDragOver, false);
	if (iCompare < 0) document.getElementById("dropzonebox").addEventListener('dragdrop', WSProDropZoneDrop, false);
    document.getElementById("dropzonebox").addEventListener('drop', WSProDropZoneDrop, false);

	document.title = this.oUtils.TranslateString("mmsearch-settings-titleandversion", this.oUtils.GetVersion());

	if (document.getElementById('color_dropzone').mPicker) //Does not exist if you have Rainbowpicker installed. Not sure if this should be my problem, but my extension does not work otherwise...
	{
		//Add the Captain Caveman color...
		document.getElementById('color_dropzone').mPicker.mBox.lastChild.lastChild.style.backgroundColor = "#6487DC";
		document.getElementById('color_dropzone').mPicker.mBox.lastChild.lastChild.style.color = "#6487DC";
		document.getElementById('color_dropzone').mPicker.mBox.lastChild.lastChild.setAttribute('color', '#6487DC');
	}
	if (document.getElementById('color_qts').mPicker) //Does not exist if you have Rainbowpicker installed. Not sure if this should be my problem, but my extension does not work otherwise...
	{
		//Add the Captain Caveman color...
		document.getElementById('color_qts').mPicker.mBox.lastChild.lastChild.style.backgroundColor = "#6487DC";
		document.getElementById('color_qts').mPicker.mBox.lastChild.lastChild.style.color = "#6487DC";
		document.getElementById('color_qts').mPicker.mBox.lastChild.lastChild.setAttribute('color', '#6487DC');
	}
	
	setTimeout(function() {CheckPre16FreeSearchEngine();}, 1);

	//Initialize the Search engines
	setTimeout(function() {CheckCavemanServer();}, 100);
	
	this.aFreeSearchEngines = null;
	this.aFreeSearchGroups = null;
	this.aKeyboardShortcuts = null;
	this.aDropZones = null;
	
	this.sLastSelectedSEGroupID = "";
	
	WSProInitShortcuts();
	WSProInitFreeSearchEngines();
	WSProInitFreeSearchGroups();
	WSProInitDropZones();
	HideSystemSEGroups(this.oUtils.GetBool("mmsearch-hidewsprosystemgroups"));
    
    document.getElementsByAttribute("preference", "pref_loadsearchtabsinforeground")[0].setAttribute("disabled", !document.getElementsByAttribute("preference", "pref_resultsinnewtab")[0].checked);
    document.getElementsByAttribute("preference", "pref_loadsearchtabsinforeground_cm")[0].setAttribute("disabled", !document.getElementsByAttribute("preference", "pref_resultsinnewtab_cm")[0].checked);
    document.getElementsByAttribute("preference", "pref_loadsearchtabsinforeground_dend")[0].setAttribute("disabled", !document.getElementsByAttribute("preference", "pref_resultsinnewtab_dend")[0].checked);
    document.getElementsByAttribute("preference", "pref_loadsearchtabsinforeground_qts")[0].setAttribute("disabled", !document.getElementsByAttribute("preference", "pref_resultsinnewtab_qts")[0].checked);
}

function CheckPre16FreeSearchEngine()
{
	if (this.oUtils.HasUserValue("mmsearch-freesearchname") == true && this.oUtils.GetString("mmsearch-freesearchname") != "" && this.oUtils.GetString("mmsearch-freesearchurl") != "")
	{
		//Send pre version 1.6 freesearch engines as a request to the server, and clear them.
		SuggestSearchEngine();
	}
}

function WSProLoadSearchEnginesPage()
{
	var oBrowser;
	if (typeof(opener.getBrowser) == "function")
	{
		oBrowser = opener.getBrowser();
	}
	else
	{
		if (!opener.opener)
		{
			oBrowser = opener.top.document.getElementById("content");
		}
		else if (typeof(opener.opener.getBrowser) == "function")
		{
			oBrowser = opener.opener.getBrowser();
		}
	}
	oBrowser.selectedTab = oBrowser.addTab(this.oUtils.GetString("mmsearch-freesearchenginesurl"));
}

function WSProUpdateSearchEngines()
{
	var sIDs = "";
	var iIndex, iLen, iEnginesToUpdate = 0;
	
	iLen = this.aFreeSearchEngines.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (this.aFreeSearchEngines[iIndex][0].indexOf('p') < 0 && this.aFreeSearchEngines[iIndex][0].indexOf('f') < 0)
		{
			sIDs += "id" + this.aFreeSearchEngines[iIndex][0] + "_";
			iEnginesToUpdate ++;
		}
	}
	if (sIDs != "")
	{
		sIDs = sIDs.substr(0, sIDs.length - 1);
		var oRequest = new XMLHttpRequest();
		var sURI = this.oUtils.GetString("mmsearch-freesearchenginesurl") + "?update=" + sIDs;
		var sUpdatedSEs = "";

		oRequest.open('GET', sURI, true);
		oRequest.overrideMimeType("text/plain");
		oRequest.onreadystatechange = function ()
		{
			if (oRequest.readyState == 4)
			{
			    if (oRequest.status != 404 && oRequest.responseText)
			    {
                    WSProUpdateSearchEnginesAsync(oRequest.responseText, iEnginesToUpdate);
                }
            }
        }

		oRequest.send(null);
    }
}

function WSProUpdateSearchEnginesAsync(sResponse, iEnginesToUpdate)
{  
	var bSuccess = false;
    var iStart = 0, iEnd;
    iStart = sResponse.indexOf('<span id="seupdate">', 0);
    if (iStart >= 0)
    {
	    iEnd = sResponse.indexOf('</span>', iStart);
	    if (iEnd >= 0)
	    {
		    sUpdatedSEs = sResponse.substring(iStart + 20, iEnd);
		    sUpdatedSEs = this.oUtils.Alltrim(sUpdatedSEs);

		    var aUpdatedSEs = new Array();
		    var aTemp = new Array();
		    aTemp = sUpdatedSEs.split('f_e');
		    var iTIndex, iTLen = aTemp.length;

		    for (iTIndex = 0; iTIndex < iTLen; iTIndex ++)
		    {
			    if (aTemp[iTIndex] != "")
			    {
				    aUpdatedSEs[iTIndex] = new Array();
				    aUpdatedSEs[iTIndex] = aTemp[iTIndex].split('f_v');
			    }
		    }
		    
		    if (aUpdatedSEs.length == iEnginesToUpdate)
		    {
			    //Compare ID's and replace only the URI. (stopped updating favicons and types in v2.3
			    var iLen1, iLen2, iIndex1, iIndex2;
			    
			    iLen1 = aUpdatedSEs.length;
			    iLen2 = this.aFreeSearchEngines.length;
			    var iImage;
			    for (iIndex1 = 0; iIndex1 < iLen1; iIndex1 ++)
			    {
				    for (iIndex2 = 0; iIndex2 < iLen2; iIndex2 ++)
				    {
					    if (aUpdatedSEs[iIndex1][0] == this.aFreeSearchEngines[iIndex2][0])
					    {
						    this.aFreeSearchEngines[iIndex2][2] = aUpdatedSEs[iIndex1][2]; //URI
						    if (this.oUtils.GetBool("mmsearch-updateallsearchengineproperties")) //Allows me to update all properties once after this (or future) updates.
						    {
							    this.aFreeSearchEngines[iIndex2][3] = aUpdatedSEs[iIndex1][3]; //Type
							    this.aFreeSearchEngines[iIndex2][4] = aUpdatedSEs[iIndex1][4]; //Favicon
							    if (this.aFreeSearchEngines[iIndex2][4].indexOf("data:image") < 0 && this.aFreeSearchEngines[iIndex2][4].indexOf("chrome://") < 0)
							    {
								    if (this.aFreeSearchEngines[iIndex2][4].length == 3) this.aFreeSearchEngines[iIndex2][4] = this.oUtils.GetFaviconURI(this.aFreeSearchEngines[iIndex2][2], this.aFreeSearchEngines[iIndex2][4]);
								    oImage = new Image();
								    oImage.src = this.aFreeSearchEngines[iIndex2][4];
							    }
						    }
						    bSuccess = true;
					    }
				    }
			    }
		    }
	    }
    }
	if (bSuccess)
	{
		this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
		this.oUtils.SetBool("mmsearch-updateallsearchengineproperties", false);
		WSProInitFreeSearchEnginesUI();
	}
}

function CheckCavemanServer()
{
    //Only update if setting is true
    if (this.oUtils.GetBool("mmsearch-autoupdate"))
    {
        var iLast, iCurrent;

        iLast = this.oUtils.GetInt("mmsearch-lastupdatedse");
        iCurrent = new Date().getTime() / 60000; //Minutes...

        if ((iCurrent - iLast) >  20160)
        {
            //Only update every 14 days.
            WSProUpdateSearchEngines();
            this.oUtils.SetInt("mmsearch-lastupdatedse", iCurrent);
        }
    }
}

function WSProInitFreeSearchGroups()
{
	//Initialize the free search engines array
	this.aFreeSearchGroups = null;
	this.aFreeSearchGroups = new Array();

	var aTemp = new Array();
	var sFavIconURI = "";
	aTemp = this.oUtils.GetLocalizedString("mmsearch-freesearchgroups").split('f_g');
	var iIndex, iLen = aTemp.length;

	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (aTemp[iIndex] != "")
		{
			this.aFreeSearchGroups[iIndex] = new Array();
			this.aFreeSearchGroups[iIndex] = aTemp[iIndex].split('f_v');
			
		}
	}

	WSProInitFreeSearchGroupsUI();
	WSProFilterSearchEngines();
}

function WSProInitFreeSearchEngines()
{
	//Initialize the free search engines array
	this.aFreeSearchEngines = null;
	this.aFreeSearchEngines = new Array();

	var aTemp = new Array();
	var sFavIconURI = "";
	aTemp = this.oUtils.GetLocalizedString("mmsearch-freesearchengines").split('f_e');
	var iIndex, iLen = aTemp.length;

	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (aTemp[iIndex] != "")
		{
			this.aFreeSearchEngines[iIndex] = new Array();
			this.aFreeSearchEngines[iIndex] = aTemp[iIndex].split('f_v');
			if (this.aFreeSearchEngines[iIndex][4].length == 3) sFavIconURI = this.oUtils.GetFaviconURI(this.aFreeSearchEngines[iIndex][2], this.aFreeSearchEngines[iIndex][4]);
			else sFavIconURI = this.aFreeSearchEngines[iIndex][4];
			this.aFreeSearchEngines[iIndex][4] = sFavIconURI;
		}
	}
	WSProInitFreeSearchEnginesUI();
}

function WSProCheckRemoveSG(sFSEID)
{
	var iIndex, iLen = this.aFreeSearchEngines.length;
	
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aFreeSearchEngines[iIndex][3] == sFSEID) return false;}
	return true;
}

function WSProCountGroupEngines(sGroupID)
{
	var iIndex, iLen = this.aFreeSearchEngines.length;
    var iCount = 0;
	
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aFreeSearchEngines[iIndex][3] == sGroupID) iCount ++;}
	return iCount;
}

function WSProRemoveSG(oSearchGroup, sFSEID)
{
	var iIndex = WSProGetFSEIDGroupIndex(sFSEID);

	if (iIndex == -1) return;
	this.aFreeSearchGroups.splice(iIndex, 1);
	this.oUtils.SetLocalizedString("mmsearch-freesearchgroups", this.oUtils.WSProFlattenFreeSearchGroups(this.aFreeSearchGroups));
	
	WSProInitFreeSearchGroups();
}

function WSProRemoveSE(oSearchEngine, sFSEID)
{
    if (this.oUtils.GetBool("mmsearch-confirmdelete") == true)
    {
        var oPromptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
        var checkResult = {};
        var bDelete = oPromptService.confirmCheck(window,this.oUtils.TranslateString('mmsearch-toolbar-msg-delete-title'), this.oUtils.TranslateString('mmsearch-toolbar-msg-delete-question'), this.oUtils.TranslateString('mmsearch-toolbar-msg-showonce'), checkResult);

        this.oUtils.SetBool("mmsearch-confirmdelete", (!checkResult.value));

        if (!bDelete) return;
    }

	var iIndex = WSProGetFSEIDIndex(sFSEID);

	if (iIndex == -1) return;
	this.aFreeSearchEngines.splice(iIndex, 1);
	this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
	
	//Check if there's also a shortcut to remove.
	iIndex = WSProGetShortcutIndex(sFSEID);
	if (iIndex >= 0) this.aKeyboardShortcuts.splice(iIndex, 1);
	this.oUtils.SetLocalizedString("mmsearch-shortcutkeys", WSProFlattenShortcuts());
	//Check if there's also a dropzone to remove.
	iIndex = WSProGetDropZoneIndex(sFSEID);
	while (iIndex >= 0)
	{
		this.aDropZones.splice(iIndex, 1);
		iIndex = WSProGetDropZoneIndex(sFSEID);
	}
    var sData = WSProFlattenDropZones();
    if (sData && sData != "" && sData.length > 10) 
	this.oUtils.SetLocalizedString("mmsearch-dropzones", sData);

	//Remove the FF search engine file.
	sFSEID = sFSEID.replace('ct_fse_', '');
	sFSEID = sFSEID.replace('tb_fse_', '');
	
	if (sFSEID.substr(0,1) == "f")
	{
		var aFFIDs = this.oUtils.WSProGetLinkedFFSEArray();
		var iFSEIDIndex = this.oUtils.WSProGetLinkedFFSEIndex(aFFIDs, "", sFSEID);
		if (iFSEIDIndex >= 0)
		{
			var sFFID = aFFIDs[iFSEIDIndex][0];
			var oSS = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);
			var oEngines = oSS.getEngines({});
			var iFFIndex, iFFLen = oEngines.length;
			var bFound = false;
			for (iFFIndex = 0; iFFIndex < iFFLen; iFFIndex ++)
			{
				if (sFFID == oEngines[iFFIndex].wrappedJSObject._id)
				{
					try {oSS.removeEngine(oEngines[iFFIndex]);}
					catch (e) {}
					bFound = true;
					break;
				}
			}
			//Mark it to not link again.
			this.oUtils.SetString("mmsearch-notlinkedffsearchengines", this.oUtils.GetString("mmsearch-notlinkedffsearchengines") + "l_e" + sFFID);
		}
	}
	//Remove the linked FF Search Engine.
	this.oUtils.WSProRemoveLinkedFFSE(sFSEID);
	if (this.oUtils.GetString('mmsearch-defaultse') == sFSEID) this.oUtils.SetString('mmsearch-defaultse', 'recentfseid')

	WSProInitFreeSearchGroups();
	WSProInitFreeSearchEnginesUI();
	WSProInitDropZonesUI();
}

function WSProReportSE(oSearchEngine, sFSEID)
{
	var iIndex = WSProGetFSEIDIndex(sFSEID);

	if (iIndex == -1) return;
	
	var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
	var sReason = {value: ""};
	var oCheck = {value: false};
	if (promptService.prompt(window, this.oUtils.TranslateString('wspro-report-title'), this.oUtils.TranslateString('wspro-report-prompt', this.aFreeSearchEngines[iIndex][1]), sReason, null, oCheck))
	{	
		var oRequest = new XMLHttpRequest();
		var sURL = this.oUtils.GetString("mmsearch-freesearchenginesurl") + "?reportid=" + this.aFreeSearchEngines[iIndex][0] + "&reportlabel=" + this.aFreeSearchEngines[iIndex][1] + "&reporturi=" + this.aFreeSearchEngines[iIndex][2] + "&reportreason=" + encodeURIComponent(sReason.value);
		oRequest.open('GET', sURL, true);
		oRequest.oUtils = this.oUtils;
		oRequest.onreadystatechange = function ()
		{
			if (oRequest.readyState == 4)
			{
				try
				{
					if (oRequest.status == 200)
					{
						alert(oRequest.oUtils.TranslateString("wspro-report-success"));
					}
					else
					{
						alert(oRequest.oUtils.TranslateString("mmsearch-alert-suggest-failed"));
					}
				}
				catch (e)
				{
					alert(oRequest.oUtils.TranslateString("mmsearch-alert-suggest-failed"));
				}
			}
		};
		oRequest.send(null);
	}
}

function WSProDragMoveSG(sDroppedFSEID, sTargetFSEID)
{
	var iTargetIndex, iDroppedIndex, iAddToIndex = 0;
	
	iDroppedIndex = WSProGetFSEIDGroupIndex(sDroppedFSEID);
	if (iDroppedIndex >= 0)
	{
		var aSearchGroup = this.aFreeSearchGroups.splice(iDroppedIndex, 1)[0]; //Remove the SG.

		if (sTargetFSEID.indexOf("_after_") >= 0)
		{
			iAddToIndex = 1;
			sTargetFSEID = sTargetFSEID.replace("_after_", "");
		}
		iTargetIndex = WSProGetFSEIDGroupIndex(sTargetFSEID) + iAddToIndex;
		
		if (iTargetIndex < 0) iTargetIndex = 0;
		
		this.aFreeSearchGroups.splice(iTargetIndex, 0, aSearchGroup); //Insert the SE.

		this.oUtils.SetLocalizedString("mmsearch-freesearchgroups", this.oUtils.WSProFlattenFreeSearchGroups(this.aFreeSearchGroups));
		WSProInitFreeSearchGroupsUI();
	}
}

function WSProDragMoveSE(sDroppedFSEID, sTargetFSEID)
{
	var iTargetIndex, iDroppedIndex, iAddToIndex = 0;
	
	iDroppedIndex = WSProGetFSEIDIndex(sDroppedFSEID);
	if (iDroppedIndex >= 0)
	{
		var aSearchEngine = this.aFreeSearchEngines.splice(iDroppedIndex, 1)[0]; //Remove the SE.

		if (sTargetFSEID.indexOf("_after_") >= 0)
		{
			iAddToIndex = 1;
			sTargetFSEID = sTargetFSEID.replace("_after_", "");
		}
		iTargetIndex = WSProGetFSEIDIndex(sTargetFSEID) + iAddToIndex;
		
		if (iTargetIndex < 0) iTargetIndex = 0;
		
		this.aFreeSearchEngines.splice(iTargetIndex, 0, aSearchEngine); //Insert the SE.

		this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
		WSProInitFreeSearchEnginesUI();
	}
}

function WSProDragMoveSEType(sDroppedFSEID, sTargetFSEID)
{
	var iTargetIndex, iDroppedIndex;
	
	iDroppedIndex = WSProGetFSEIDIndex(sDroppedFSEID);
	if (iDroppedIndex >= 0)
	{
		sTargetFSEID = sTargetFSEID.replace("_after_", "");
		iTargetIndex = WSProGetFSEIDGroupIndex(sTargetFSEID);
		
		if (iTargetIndex < 0) iTargetIndex = 0;
		
		this.aFreeSearchEngines[iDroppedIndex][3] = this.aFreeSearchGroups[iTargetIndex][0];

		this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
		WSProInitFreeSearchEnginesUI();
		WSProInitFreeSearchGroupsUI();
	}
}

function WSProSort(sOrder)
{
	if (sOrder == "ASC") this.aFreeSearchEngines.sort(WSProArrayCompareAsc);
	if (sOrder == "DESC") this.aFreeSearchEngines.sort(WSProArrayCompareDesc);
	this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
	this.oUtils.SetString("mmsearch-autosortorder", sOrder);

	WSProInitFreeSearchEnginesUI();
}

function WSProArrayCompareAsc(a1, a2)
{
	if (a1[1].toUpperCase() < a2[1].toUpperCase()) return -1;
	return 1;
}

function WSProArrayCompareDesc(a1, a2)
{
	if (a1[1].toUpperCase() > a2[1].toUpperCase()) return -1;
	return 1;
}

function WSProInitFreeSearchGroupsUI()
{
	var oOverview = document.getElementById('vbox_searchenginegroups').firstChild;
	var oGroupLabels = document.getElementById('groupsearchlabels');
	var oSearchGroup, oItem;
    var sShortcut;
    var iShortcut;

	if (oOverview.firstChild) oOverview.boxObject.QueryInterface(Components.interfaces.nsIScrollBoxObject).ensureElementIsVisible(oOverview.firstChild);

	RemoveAllChildren(oOverview);

	var iIndex, iLen = this.aFreeSearchGroups.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		oSearchGroup = document.getElementById('clone_sgrow').cloneNode(true);

		oSearchGroup.id = 'ssg_' + this.aFreeSearchGroups[iIndex][0];
		oSearchGroup.setAttribute('fseid', this.aFreeSearchGroups[iIndex][0]);
		if (iIndex % 2 == 0) oSearchGroup.setAttribute('difrow', true);
		else oSearchGroup.setAttribute('difrow', false);

		oItem = document.getElementById("ct-vlist-wspro-" + this.aFreeSearchGroups[iIndex][0]);
		if (oItem)
		{
			this.aFreeSearchGroups[iIndex][1] = oItem.getAttribute('fselabel');
			this.aFreeSearchGroups[iIndex][2] = oItem.getAttribute('fseicon');
		}

		iShortcut = WSProGetShortcutIndex(this.aFreeSearchGroups[iIndex][0]);
		sShortcut = "";
		if (iShortcut >= 0)
		{
			sShortcut = this.aKeyboardShortcuts[iShortcut][0];
			if (this.aKeyboardShortcuts[iShortcut][2] == "S") {sShortcut = " (CTRL+SHIFT+" + sShortcut + ")";}
			else {sShortcut = " (CTRL+ALT+" + sShortcut + ")";}
		}

		oSearchGroup.childNodes[0].setAttribute('src', this.aFreeSearchGroups[iIndex][2]);
		oSearchGroup.childNodes[1].setAttribute('value', this.aFreeSearchGroups[iIndex][1] + " (" + WSProCountGroupEngines(this.aFreeSearchGroups[iIndex][0]) + ")" + sShortcut);
		if (!WSProCheckRemoveSG(this.aFreeSearchGroups[iIndex][0]))
		{
			oSearchGroup.childNodes[2].childNodes[2].setAttribute('disabled', true);
		}
		if (this.aFreeSearchGroups[iIndex][0].indexOf('g') == -1)
		{
			//oSearchGroup.childNodes[2].childNodes[0].setAttribute('disabled', true);
			oSearchGroup.childNodes[2].childNodes[2].setAttribute('disabled', true);
		}

		oOverview.appendChild(oSearchGroup);
	}
}

function WSProInitFreeSearchEnginesUI()
{
	var oOverview = document.getElementById('vbox_selectedengines').firstChild;
	var oDefaultSEMenu = document.getElementById('ml_defaultse');
	var oSearchEngine;
	var sShortcut;
    var sFavIcon = "";
	var iShortcut, iGroupIndex;
	var bAllowReport = true;
    var iRGBValue = 0;
    var iStatTotal = this.oUtils.WSProGetTotalSEStat();

	if (oOverview.firstChild) oOverview.boxObject.QueryInterface(Components.interfaces.nsIScrollBoxObject).ensureElementIsVisible(oOverview.firstChild);

	RemoveAllChildren(oOverview);
	RemoveAllChildren(oDefaultSEMenu);
	oDefaultSEMenu.appendItem(this.oUtils.TranslateString("wspro-settings-general-defaultse-dontswitch"), "");
	oDefaultSEMenu.appendItem(this.oUtils.TranslateString("wspro-settings-general-defaultse-switchtoused"), "recentfseid");

	var iIndex, iLen = this.aFreeSearchEngines.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		oSearchEngine = document.getElementById('clone_serow').cloneNode(true);

		oSearchEngine.id = 'sse_' + this.aFreeSearchEngines[iIndex][0];
		oSearchEngine.setAttribute('fseid', this.aFreeSearchEngines[iIndex][0]);
		oSearchEngine.setAttribute('fsetype', this.aFreeSearchEngines[iIndex][3]);
		if (iIndex % 2 == 0) oSearchEngine.setAttribute('difrow', true);
		else oSearchEngine.setAttribute('difrow', false);

		if (this.aFreeSearchEngines[iIndex][4].length == 3) sFavIcon = this.oUtils.GetFaviconURI(this.aFreeSearchEngines[iIndex][2], this.aFreeSearchEngines[iIndex][4]);
		else sFavIcon = this.aFreeSearchEngines[iIndex][4];
		
		if (sFavIcon == "")
		{
			if (this.aFreeSearchEngines[iIndex][3] == "movie") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_movie.png";
			else if (this.aFreeSearchEngines[iIndex][3] == "music") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_music.png";
			else if (this.aFreeSearchEngines[iIndex][3] == "other") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";
			else if (this.aFreeSearchEngines[iIndex][3] == "compu") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_computer.png";
			else if (this.aFreeSearchEngines[iIndex][3] == "educa") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_education.png";
			else if (this.aFreeSearchEngines[iIndex][3] == "newss") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_news.png";
			else if (this.aFreeSearchEngines[iIndex][3] == "refer") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_reference.png";
			else if (this.aFreeSearchEngines[iIndex][3] == "shopp") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_shopping.png";
			else if (this.aFreeSearchEngines[iIndex][3] == "busin") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_business.png";
			else
			{
				/*No favicon, and custom group*/
				iGroupIndex = WSProGetGroupIndex(this.aFreeSearchEngines[iFSEIndex][3]);
				if (iGroupIndex >= 0) sFavIcon = this.aFreeSearchGroups[iGroupIndex][2];
				else sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";						
			}
		}

		oSearchEngine.childNodes[0].setAttribute('src', sFavIcon);
		oSearchEngine.childNodes[1].setAttribute('value', this.aFreeSearchEngines[iIndex][1]);
		iShortcut = WSProGetShortcutIndex(this.aFreeSearchEngines[iIndex][0]);
		sShortcut = "";
		if (iShortcut >= 0)
		{
			sShortcut = this.aKeyboardShortcuts[iShortcut][0];
			if (this.aKeyboardShortcuts[iShortcut][2] == "S") {oSearchEngine.childNodes[2].setAttribute('value', "(CTRL+SHIFT+" + sShortcut + ")");}
			else {oSearchEngine.childNodes[2].setAttribute('value', "(CTRL+ALT+" + sShortcut + ")");}
		}

		oSearchEngine.childNodes[2].setAttribute('hidden', sShortcut == "");
		bAllowReport = true;
		if (this.aFreeSearchEngines[iIndex][0].indexOf('p') >= 0) bAllowReport = false;
		if (this.aFreeSearchEngines[iIndex][0].indexOf('f') >= 0) bAllowReport = false;
		oSearchEngine.childNodes[3].childNodes[2].setAttribute('disabled', !bAllowReport);

        iRGBValue = this.oUtils.WSProGetSEStatRGBValue(this.aFreeSearchEngines[iIndex][0]);
        oSearchEngine.setAttribute("tooltiptext", this.oUtils.TranslateString("wspro-ststs-usedcount", this.aFreeSearchEngines[iIndex][1], this.oUtils.WSProGetSEStatCount(this.aFreeSearchEngines[iIndex][0]), iStatTotal));
        if (iRGBValue == 0 && iStatTotal > 20)
        {
            oSearchEngine.setAttribute("style", "font-weight: bold; color: rgb(" + iRGBValue + "," + iRGBValue + "," + iRGBValue + ");");
        }
        else
        {
            oSearchEngine.setAttribute("style", "color: rgb(" + iRGBValue + "," + iRGBValue + "," + iRGBValue + ");");
        }
       
		oOverview.appendChild(oSearchEngine);
		//Add this to the list of Default Search Egines
		oDefaultSEMenu.appendItem(this.aFreeSearchEngines[iIndex][1], this.aFreeSearchEngines[iIndex][0]);
	}
	//Select the default SE, cause pref loading was already done before we initialized the popup menu above.
	oDefaultSEMenu.value = this.oUtils.GetString('mmsearch-defaultse');
	//Check if we had a group selected, if so select=filter it again.
	if (this.sLastSelectedSEGroupID != "")
	{
		var oSGRow = document.getElementById(this.sLastSelectedSEGroupID);
        if (oSGRow)
        {
    		oSGRow.setAttribute('selected', false);
    		SelectGroupRow(this.sLastSelectedSEGroupID);
        } else {this.sLastSelectedSEGroupID = "";}
	}
}

function WSProFilterSearchEngines(sGroupFSEID)
{
	if (sGroupFSEID)
	{
		var oElements = document.getElementsByAttribute('rowtype', 'searchengine');
		var iIndex, iLen = oElements.length;
		for (iIndex = 0; iIndex < iLen; iIndex ++) {oElements[iIndex].style.display = "none";}

		oElements = document.getElementsByAttribute('fsetype', sGroupFSEID);
		var iIndex, iLen = oElements.length;
		for (iIndex = 0; iIndex < iLen; iIndex ++) {oElements[iIndex].style.display = "-moz-box";}
	}
	else
	{
		var oElements = document.getElementsByAttribute('rowtype', 'searchengine');
		var iIndex, iLen = oElements.length;
		for (iIndex = 0; iIndex < iLen; iIndex ++) {oElements[iIndex].style.display = "-moz-box";}
	}
}

function WSProEditSG(oSearchGroup, sFSEID)
{
	var iIndex = WSProGetFSEIDGroupIndex(sFSEID);

	if (iIndex == -1) return;
	window.openDialog("chrome://websearchpro/content/websearchprosearchengine.xul", "", "centerscreen,chrome,modal,resizable", "editgroup", iIndex);
}

function WSProEditSE(oSearchEngine, sFSEID)
{
	var iIndex = WSProGetFSEIDIndex(sFSEID);

	if (iIndex == -1) return;
	window.openDialog("chrome://websearchpro/content/websearchprosearchengine.xul", "", "centerscreen,chrome,modal,resizable", "edit", iIndex);
}

function WSProGetFSEIDGroupIndex(sFSEID)
{
	var iIndex, iLen = this.aFreeSearchGroups.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aFreeSearchGroups[iIndex][0] == sFSEID) return iIndex;}
	return -1;
}

function WSProGetFSEIDIndex(sFSEID)
{
	var iIndex, iLen = this.aFreeSearchEngines.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aFreeSearchEngines[iIndex][0] == sFSEID) return iIndex;}
	return -1;
}

function WSProGetGroupIndex(sGroupID)
{
	if (this.oUtils) this.oUtils.LogDebugMessage("WSProGetGroupIndex('" + sGroupID + "')");
	var iIndex, iLen = this.aFreeSearchGroups.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aFreeSearchGroups[iIndex][0] == sGroupID) return iIndex;}
	return -1;
}

function WSProGetShortcutIndex(sFSEID)
{
	var iIndex, iLen = this.aKeyboardShortcuts.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aKeyboardShortcuts[iIndex][1] == sFSEID) return iIndex;}
	return -1;
}

function WSProGetDropZoneIndex(sFSEID)
{
	var iIndex, iLen = this.aDropZones.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aDropZones[iIndex][2] == sFSEID) return iIndex;}
	return -1;
}

function WSProGetFSEIDShortcut(sFSEID)
{
	var iIndex, iLen = this.aKeyboardShortcuts.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aKeyboardShortcuts[iIndex][1] == sFSEID) return this.aKeyboardShortcuts[iIndex][0];}
	return "";
}

function WSProInitShortcuts()
{
	//Init Keyboard shotrcuts array.
	this.aKeyboardShortcuts = null;
	this.aKeyboardShortcuts = new Array();

	var aTemp = new Array();
	var oKey;
	aTemp = this.oUtils.GetLocalizedString("mmsearch-shortcutkeys").split('s_k');
	var iIndex, iLen = aTemp.length;

	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (aTemp[iIndex] != "")
		{
			this.aKeyboardShortcuts[iIndex] = new Array();
			this.aKeyboardShortcuts[iIndex] = aTemp[iIndex].split('s_v');
			if (this.aKeyboardShortcuts[iIndex].length == 2)
			{
				//Pre 2.2, add S or A for SHIFT or ALT.
				this.aKeyboardShortcuts[iIndex][2] = "S";
			}
		}
	}
}

function WSProFlattenShortcuts()
{
	var aTemp = new Array();
	var sResult = "";
	var iIndex, iLen = this.aKeyboardShortcuts.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		aTemp[iIndex] = this.aKeyboardShortcuts[iIndex].join('s_v');
	}
	sResult = aTemp.join('s_k');

	return sResult;
}

function WSProInitDropZones()
{
	this.aDropZones = null;
	this.aDropZones = new Array();

	var aTemp = new Array();
	aTemp = this.oUtils.GetLocalizedString("mmsearch-dropzones").split('d_z');
	var iIndex, iLen = aTemp.length;

	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (aTemp[iIndex] != "")
		{
			this.aDropZones[iIndex] = new Array();
			this.aDropZones[iIndex] = aTemp[iIndex].split('d_v');
		}
	}
	setTimeout(function() {WSProInitDropZonesUI();}, 100);
}

function WSProInitDropZonesUI()
{
	var oDZ;
	var oElement;
	var sFSEID, sLabel, sFavIcon, sUnAssigned = this.oUtils.TranslateString('wspro-dropzone-unassigned');
	var iFSEIndex, iIndex, iLen = this.aDropZones.length;
	var iX, iY;
	
	//Clear all...
	for (iX = 0; iX < 8; iX ++)
	{
		for (iY = 0; iY < 8; iY ++)
		{
			oDZ = document.getElementById('dz_' + iX + '_' + iY);
			oDZ.setAttribute('fseid', '');
			oDZ.setAttribute('tooltiptext', sUnAssigned);
			oDZ.setAttribute('selected', false);
			oDZ.firstChild.setAttribute('tooltiptext', sUnAssigned);
			oDZ.firstChild.setAttribute('src', '');
		}
	}
	
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		oDZ = document.getElementById('dz_' + this.aDropZones[iIndex][0] + '_' + this.aDropZones[iIndex][1]);
		iFSEIndex = WSProGetFSEIDIndex(this.aDropZones[iIndex][2]);
		if (iFSEIndex >= 0)
		{
			sFSEID = this.aFreeSearchEngines[iFSEIndex][0];
			sLabel = this.aFreeSearchEngines[iFSEIndex][1];
			if (this.aFreeSearchEngines[iFSEIndex][4].length == 3) sFavIcon = this.oUtils.GetFaviconURI(this.aFreeSearchEngines[iFSEIndex][2], this.aFreeSearchEngines[iFSEIndex][4]);
			else sFavIcon = this.aFreeSearchEngines[iFSEIndex][4];

			if (sFavIcon == "")
			{
				if (this.aFreeSearchEngines[iFSEIndex][3] == "movie") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_movie.png";
				else if (this.aFreeSearchEngines[iFSEIndex][3] == "music") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_music.png";
				else if (this.aFreeSearchEngines[iFSEIndex][3] == "other") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";
				else if (this.aFreeSearchEngines[iFSEIndex][3] == "compu") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_computer.png";
				else if (this.aFreeSearchEngines[iFSEIndex][3] == "educa") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_education.png";
				else if (this.aFreeSearchEngines[iFSEIndex][3] == "newss") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_news.png";
				else if (this.aFreeSearchEngines[iFSEIndex][3] == "refer") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_reference.png";
				else if (this.aFreeSearchEngines[iFSEIndex][3] == "shopp") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_shopping.png";
				else if (this.aFreeSearchEngines[iFSEIndex][3] == "busin") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_business.png";
			}
			
			oDZ.setAttribute('fseid', sFSEID);
			oDZ.setAttribute('tooltiptext', sLabel);
			oDZ.setAttribute('selected', true);
			oDZ.firstChild.setAttribute('tooltiptext', sLabel);
			oDZ.firstChild.setAttribute('src', sFavIcon);
		}
		else
		{
			iFSEIndex = WSProGetFSEIDGroupIndex(this.aDropZones[iIndex][2]);
			if (iFSEIndex >= 0)
			{
				sFSEID = this.aFreeSearchGroups[iFSEIndex][0];
				sLabel = this.aFreeSearchGroups[iFSEIndex][1];
				sFavIcon = this.aFreeSearchGroups[iFSEIndex][2];

				oDZ.setAttribute('fseid', sFSEID);
				oDZ.setAttribute('tooltiptext', sLabel);
				oDZ.setAttribute('selected', true);
				oDZ.firstChild.setAttribute('tooltiptext', sLabel);
				oDZ.firstChild.setAttribute('src', sFavIcon);
			}
		}
	}
	UpdateDZColor();
}

function UpdateDZColor(sColor)
{
	var oDZ;
	var iX, iY;
	
	if (!sColor) sColor = document.getElementById('color_dropzone').color
	
	for (iX = 0; iX < 8; iX ++)
	{
		for (iY = 0; iY < 8; iY ++)
		{
			oDZ = document.getElementById('dz_' + iX + '_' + iY);
			if (oDZ.getAttribute('selected') == 'true') oDZ.style.backgroundColor = sColor;
			else oDZ.style.backgroundColor = "";
		}
	}
}

function WSProDragSwitchDropZone(sSourceID, sTargetID)
{
	var oSource = document.getElementById(sSourceID);
	var oTarget = document.getElementById(sTargetID);
	
	if (oSource && oTarget && sSourceID != sTargetID)
	{
		var sSFSEID = oSource.getAttribute('fseid');
		var sSTooltiptext = oSource.getAttribute('tooltiptext');
		var sSSRC = oSource.firstChild.getAttribute('src');
		var sSSelected = oSource.getAttribute('selected');

		var sTFSEID = oTarget.getAttribute('fseid');
		var sTTooltiptext = oTarget.getAttribute('tooltiptext');
		var sTSRC = oTarget.firstChild.getAttribute('src');
		var sTSelected = oTarget.getAttribute('selected');		
		
		oSource.setAttribute('fseid', sTFSEID);
		oSource.setAttribute('tooltiptext', sTTooltiptext);
		oSource.setAttribute('selected', sTSelected);
		oSource.firstChild.setAttribute('tooltiptext', sTTooltiptext);
		oSource.firstChild.setAttribute('src', sTSRC);
		
		oTarget.setAttribute('fseid', sSFSEID);
		oTarget.setAttribute('tooltiptext', sSTooltiptext);
		oTarget.setAttribute('selected', sSSelected);
		oTarget.firstChild.setAttribute('tooltiptext', sSTooltiptext);
		oTarget.firstChild.setAttribute('src', sSSRC);
	}
	UpdateDZColor();
}

function HighlightDZ(oElement)
{
	if (oElement.getAttribute('selected') == 'false')
	{
		var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
		var aFSEs = new Array();
		var aSelected = {};
		var sLabel = "", sFavIcon = "", sFSEID = "";
		var iIndex, iLen = this.aFreeSearchEngines.length;
		
		for (iIndex = 0; iIndex < iLen; iIndex ++) {aFSEs[iIndex] = this.aFreeSearchEngines[iIndex][1];}
		iLen = this.aFreeSearchGroups.length
		for (iIndex = 0; iIndex < iLen; iIndex ++) {aFSEs[aFSEs.length] = this.aFreeSearchGroups[iIndex][1];}

		var bResult = promptService.select(window,this.oUtils.TranslateString('wspro-prompt-title'), this.oUtils.TranslateString('wspro-select-editdropzone'), aFSEs.length, aFSEs, aSelected);
		if (bResult)
		{
			if (aSelected.value < this.aFreeSearchEngines.length)
			{
				iIndex = aSelected.value;
				sFSEID = this.aFreeSearchEngines[iIndex][0];
				sLabel = this.aFreeSearchEngines[iIndex][1];
				if (this.aFreeSearchEngines[iIndex][4].length == 3) sFavIcon = this.oUtils.GetFaviconURI(this.aFreeSearchEngines[iIndex][2], this.aFreeSearchEngines[iIndex][4]);
				else sFavIcon = this.aFreeSearchEngines[iIndex][4];

				if (sFavIcon == "")
				{
					if (this.aFreeSearchEngines[iIndex][3] == "movie") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_movie.png";
					else if (this.aFreeSearchEngines[iIndex][3] == "music") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_music.png";
					else if (this.aFreeSearchEngines[iIndex][3] == "other") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_other.png";
					else if (this.aFreeSearchEngines[iIndex][3] == "compu") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_computer.png";
					else if (this.aFreeSearchEngines[iIndex][3] == "educa") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_education.png";
					else if (this.aFreeSearchEngines[iIndex][3] == "newss") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_news.png";
					else if (this.aFreeSearchEngines[iIndex][3] == "refer") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_reference.png";
					else if (this.aFreeSearchEngines[iIndex][3] == "shopp") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_shopping.png";
					else if (this.aFreeSearchEngines[iIndex][3] == "busin") sFavIcon = "chrome://websearchpro/skin/websearchpro_toolbar_free_business.png";
				}
			
				oElement.setAttribute('fseid', sFSEID);
				oElement.setAttribute('tooltiptext', sLabel);
				oElement.firstChild.setAttribute('tooltiptext', sLabel);
				oElement.firstChild.setAttribute('src', sFavIcon);
			}
			else
			{
				iIndex = aSelected.value - this.aFreeSearchEngines.length;
				sFSEID = this.aFreeSearchGroups[iIndex][0];
				sLabel = this.aFreeSearchGroups[iIndex][1];
				sFavIcon = this.aFreeSearchGroups[iIndex][2];
			
				oElement.setAttribute('fseid', sFSEID);
				oElement.setAttribute('tooltiptext', sLabel);
				oElement.firstChild.setAttribute('tooltiptext', sLabel);
				oElement.firstChild.setAttribute('src', sFavIcon);			
			}
			oElement.setAttribute('selected', true);
		}
		else {oElement.setAttribute('selected', false);}
	}
	else
	{
		var sUnAssigned = this.oUtils.TranslateString('wspro-dropzone-unassigned');
		oElement.setAttribute('fseid', '');
		oElement.setAttribute('tooltiptext', sUnAssigned);
		oElement.firstChild.setAttribute('tooltiptext', sUnAssigned);
		oElement.firstChild.setAttribute('src', '');		
		oElement.setAttribute('selected', false);
	}
	UpdateDZColor();	
}

function WSProFlattenDropZones()
{
	var aTemp = new Array();
	var sResult = "";
	var iIndex, iLen = this.aDropZones.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		aTemp[iIndex] = this.aDropZones[iIndex].join('d_v');
	}
	sResult = aTemp.join('d_z');

	return sResult;
}

function ApplyChanges(bDontClose)
{
	if (!this.oUtils) return false;
	if (!this.aFreeSearchEngines || this.aFreeSearchEngines.length == 0)
	{
		alert(this.oUtils.TranslateString("mmsearch-alert-selectone"));
		return false;
	}

	this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
	this.oUtils.SetLocalizedString("mmsearch-shortcutkeys", WSProFlattenShortcuts());

	//Update the DropZone(s).
	var oDZs = document.getElementsByAttribute('class', 'dropzone_small');
	var sDZFSEID, sX, sY;
	var iIndex, iLen;
	
	this.aDropZones = null;
	this.aDropZones = new Array();
	iLen = oDZs.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		sDZFSEID = oDZs[iIndex].getAttribute('fseid');
		if (sDZFSEID && sDZFSEID != "")
		{
			sX = oDZs[iIndex].getAttribute('id').substr(3, 1);
			sY = oDZs[iIndex].getAttribute('id').substr(5, 1);
			this.aDropZones[this.aDropZones.length] = new Array(sX, sY, sDZFSEID);
		}
	}
    var sData = WSProFlattenDropZones();
    if (sData && sData != "" && sData.length > 10) 
	this.oUtils.SetLocalizedString("mmsearch-dropzones", sData);
    
	var sFSEID = this.oUtils.GetString("mmsearch-defaultse");
	if (sFSEID != "" && sFSEID != "recentfseid") this.oUtils.SetString("mmsearch-preferedsearchengine", "tb_fse_" + sFSEID);

	var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
	oObService.notifyObservers(opener, "apply-settings", "OK");

	if (!bDontClose)
	{
		oObService.removeObserver(this.SEObserver, "apply-se"); 
		oObService.removeObserver(this.SEObserver, "new-searchengine");
		this.SEObserver = null;

		this.oUtils = null;
		window.close();
	}

	return true;
}

function SuggestSearchEngine()
{
	//Display the "Suggest a Search Engine" screen.
	window.openDialog("chrome://websearchpro/content/websearchprosearchengine.xul", "", "centerscreen,chrome,modal,resizable", "suggest");
}

function AddSearchEngineGroup()
{
	var sID = 'g' + this.oUtils.PadLeft((parseInt(this.oUtils.GetString("mmsearch-freesearchgroupid").replace('g', ''), 10) + 1), 4, '0');
	if (!CheckGroupID(sID))
	{
		sID = GetHightestUsedGroupID();
		if (!CheckGroupID(sID))
		{
			sID = "g1000";
		}
	}
	this.oUtils.SetString("mmsearch-freesearchgroupid", sID);

	var aSearchEngineGroup = new Array(sID, '', '');
	this.aFreeSearchGroups.splice(0, 0, aSearchEngineGroup);
	this.oUtils.SetLocalizedString("mmsearch-freesearchgroups", this.oUtils.WSProFlattenFreeSearchGroups(this.aFreeSearchGroups));
	
	//Ff 1.5.0.x If I did not remove all children from the overview before opening this specifix dialog, Firefox would GPF when returning and repopuplating the overview again, probably a garbagecollector is paying me a visit then...
	var oOverview = document.getElementById('vbox_searchenginegroups').firstChild;
	RemoveAllChildren(oOverview);

	window.openDialog("chrome://websearchpro/content/websearchprosearchengine.xul", "", "centerscreen,chrome,modal,resizable", "addgroup", 0);
}

function CheckGroupID(sID)
{
	var iIndex, iLen = this.aFreeSearchGroups.length;
	
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (this.aFreeSearchGroups[iIndex][0] == sID) return false; //Is not unique!
	}
	return true; //Is Unique
}

function GetHightestUsedGroupID()
{
	var iIndex, iLen = this.aFreeSearchGroups.length;
	var iCur = 0, iHigh = 0;
	var sHigh, sID = "";
	
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{	
		sHigh = this.aFreeSearchGroups[iIndex][0].replace('g', '');
		iHigh = parseInt(sHigh, 10);
		if (iHigh >= iCur)
		{
			iCur = iHigh;
			iHigh = iHigh + 1;
			sID = 'g' + this.oUtils.PadLeft(iHigh, 4, '0')
		}
	}
	return sID;
}

function AddPrivateSearchEngine()
{
	var sID = 'p' + (parseInt(this.oUtils.GetString("mmsearch-privatefseid").replace('p', ''), 10) + 1);
	this.oUtils.SetString("mmsearch-privatefseid", sID);

	var aSearchEngine = new Array(sID, '', '', 'other', '');
	this.aFreeSearchEngines.splice(0, 0, aSearchEngine);
	this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
	
	//Ff 1.5.0.x If I did not remove all children from the overview before opening this specifix dialog, Firefox would GPF when returning and repopuplating the overview again, probably a garbagecollector is paying me a visit then...
	//var oOverview = document.getElementById('vbox_selectedengines').firstChild;
	//RemoveAllChildren(oOverview);

	window.openDialog("chrome://websearchpro/content/websearchprosearchengine.xul", "", "centerscreen,chrome,modal,resizable", "private", 0);
}

function HideSystemSEGroups(bHide)
{
	var oItem

	oItem = document.getElementById('ssg_movie');
	if (oItem && (WSProCheckRemoveSG('movie') || !bHide)) oItem.setAttribute('hidden', bHide);
	oItem = document.getElementById('ssg_music');
	if (oItem && (WSProCheckRemoveSG('music') || !bHide)) oItem.setAttribute('hidden', bHide);
	oItem = document.getElementById('ssg_other');
	if (oItem && (WSProCheckRemoveSG('other') || !bHide)) oItem.setAttribute('hidden', bHide);
	oItem = document.getElementById('ssg_compu');
	if (oItem && (WSProCheckRemoveSG('compu') || !bHide)) oItem.setAttribute('hidden', bHide);
	oItem = document.getElementById('ssg_educa');
	if (oItem && (WSProCheckRemoveSG('educa') || !bHide)) oItem.setAttribute('hidden', bHide);
	oItem = document.getElementById('ssg_newss');
	if (oItem && (WSProCheckRemoveSG('newss') || !bHide)) oItem.setAttribute('hidden', bHide);
	oItem = document.getElementById('ssg_refer');
	if (oItem && (WSProCheckRemoveSG('refer') || !bHide)) oItem.setAttribute('hidden', bHide);
	oItem = document.getElementById('ssg_shopp');
	if (oItem && (WSProCheckRemoveSG('shopp') || !bHide)) oItem.setAttribute('hidden', bHide);
	oItem = document.getElementById('ssg_busin');
	if (oItem && (WSProCheckRemoveSG('busin') || !bHide)) oItem.setAttribute('hidden', bHide);
}

function RemoveAllChildren(oItem)
{
	var iIndex, iLen = oItem.childNodes.length - 1;
	for (iIndex = iLen; iIndex >= 0; iIndex --)
	{
		oItem.removeChild(oItem.childNodes[iIndex]);
	}
}

function WSProEnsureElementIsVisible(oElement)
{
	var oOverview = document.getElementById('vbox_selectedengines').firstChild;
	if ((oElement.boxObject.y + oElement.boxObject.height) > (oOverview.boxObject.y + oOverview.boxObject.height))
	{
		if (oElement.nextSibling) oElement = oElement.nextSibling;
	}
	else
	{
		if (oElement.previousSibling) oElement = oElement.previousSibling;
	}
	oOverview.boxObject.QueryInterface(Components.interfaces.nsIScrollBoxObject).ensureElementIsVisible(oElement);
}

function WSProBlinkElement(sElementID, iCount)
{
	var sStyle = "border: solid 1px rgb(83,132,212)";
	
	if (iCount == 1 || iCount == 3 || iCount == 5) sStyle = "border: none";
	document.getElementById(sElementID).setAttribute('style', sStyle);
	iCount ++;
	if (iCount < 6) setTimeout(function() {WSProBlinkElement(sElementID, iCount);}, 175);
}

function SelectGroupRow(sID)
{
	var oSGRow = document.getElementById(sID);
	var bSelect = (oSGRow.getAttribute('selected') == "false");
	var oElements = document.getElementsByAttribute('rowtype', 'searchgroup');
	var iIndex, iLen = oElements.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++) {oElements[iIndex].setAttribute('selected', false);}
	
	oSGRow.setAttribute('selected', bSelect);
	if (bSelect) {WSProFilterSearchEngines(oSGRow.getAttribute('fseid'));}
	else {WSProFilterSearchEngines();}
	this.sLastSelectedSEGroupID = sID;
}

function GetLocale()
{
	try
	{
		var oPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("general.useragent.");

		try {return oPref.getComplexValue("locale", Components.interfaces.nsIPrefLocalizedString).data;}
		catch (e) {}
		return oPref.getCharPref("locale");
	}
	catch (e) {}
	return "en-US";
}

function WSProExportpreferences()
{
	//Save changes.
	ApplyChanges(true);
	
    this.oUtils.Exportpreferences();
}

function WSProImportpreferences()
{
    if (this.oUtils.Importpreferences())
    {
    	var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    	oObService.notifyObservers(opener, "apply-settings", "OK");
    	InitWindow();
    }
}
