var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

function InitWindow()
{
    //Init utils.
    this.oUtils = new MMSearchUtils();
    
    var oParams = window.arguments[0];

    var sPassedFSEID = oParams.sFSEID;
    sPassedFSEID = sPassedFSEID.replace("tb-group-wspro-", "");
    sPassedFSEID = sPassedFSEID.replace("tb-vlist-wspro-", "");
    
    this.aPassedFSEIDs = new Array(sPassedFSEID);
    var aSelectedFSEIDs = oParams.aLastQTSSearchEngines;
    if (aSelectedFSEIDs)
    {
        if (this.oUtils.GetBool("mmsearch-qtsremembersearchusing")) {
            var iIndex, iLen = aSelectedFSEIDs.length;
            for (iIndex = 0; iIndex < iLen; iIndex ++)
            {
                this.aPassedFSEIDs[this.aPassedFSEIDs.length] = aSelectedFSEIDs[iIndex];
            }
        } else {
            oParams.aLastQTSSearchEngines = new Array();
        }
    }

    this.aFreeSearchEngines = null;
    this.aFreeSearchGroups = null;
    this.aSearchKeys = new Array(); //{fseid, normal label, vowelless label, first characters only, uppercase characters only, vowelless label words array, excact original label, unique smart abbreviation}

    this.bIsTyping = false;

    WSProInitFreeSearchEngines();
    WSProInitFreeSearchGroups();
    WSProInitQTSUI();
    
    this.aDynamicSearchParams = this.aDynamicSearchParams = new Array();
    this.aPassedDynamicSearchParams = oParams.aLastQTSDynamicSearchParams;
    this.WSProQTSPopulateDynamicSearchTerms();
    
    //Optionally change the autocompletesearch attribute
    var oSearchTextBox = document.getElementById("searchtext");
    if (this.oUtils.GetBool("mmsearch-googlesuggest") && ("nsIBrowserSearchService" in Components.interfaces)) {oSearchTextBox.setAttribute('autocompletesearch', 'wspro-remote-url-suggestions');}
    else {oSearchTextBox.setAttribute('autocompletesearch', 'form-history');}

    oSearchTextBox.mSearchNames = null;
    oSearchTextBox.mController.input = null;
    oSearchTextBox.mController.input = oSearchTextBox;

    //Change the background color.
    var oElement;
    oElement = document.getElementById('wspro-qts');
    oElement.style.backgroundColor = this.oUtils.GetString('mmsearch-qtscolor');
    oElement = document.getElementById('vbox-qts');
    oElement.style.backgroundColor = this.oUtils.GetString('mmsearch-qtscolor');

    document.getElementById('searchtext').value = oParams.sLastQTSSearchTerm;
    setTimeout(function() {WSProSetFocus();}, 10);
}

function WSProInitQTSUI()
{
    var oList, oItem, oClone;
    var sFavIcon = "";
    var iIndex, iLen, iGIndex, iGLen;

    oList = document.getElementById('wspro-qts-selectedengines');
    oClone = document.getElementById('wspro-qts-clone');
    iGLen = this.aFreeSearchGroups.length;
    iLen = this.aFreeSearchEngines.length;
    for (iGIndex = 0; iGIndex < iGLen; iGIndex ++)
    {
        //Add the group
        oItem = oClone.cloneNode(true);
        oItem.setAttribute('id', 'qts-' + this.aFreeSearchGroups[iGIndex][0]);
        oItem.setAttribute('fseid', 'ct-vlist-wspro-' + this.aFreeSearchGroups[iGIndex][0]);
        oItem.setAttribute('label', this.aFreeSearchGroups[iGIndex][1]);
        sFavIcon = this.aFreeSearchGroups[iGIndex][2];

        oItem.setAttribute('hidden', 'false');
        oItem.className = "";

        oList.appendChild(oItem);
        oItem.className = "listitem-iconic qts-searchenginegroup";
        oItem.setAttribute('style', 'list-style-image: url("' + sFavIcon + '");');
        
        //Add an entry to the search array.
        WSProAddSearchEntry(this.aFreeSearchGroups[iGIndex][0], this.aFreeSearchGroups[iGIndex][1]);

        //Add item(s)
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            if (this.aFreeSearchEngines[iIndex][3] == this.aFreeSearchGroups[iGIndex][0])
            {
                oItem = oClone.cloneNode(true);
                oList.appendChild(oItem);
                oItem.setAttribute('id', 'qts-' + this.aFreeSearchEngines[iIndex][0]);
                oItem.className = "listitem-iconic qts-searchengine";
                oItem.setAttribute('fseid', this.aFreeSearchEngines[iIndex][0]);
                oItem.setAttribute('groupid', this.aFreeSearchEngines[iIndex][3]);
                oItem.setAttribute('label', this.aFreeSearchEngines[iIndex][1]);
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

                oItem.setAttribute('style', 'list-style-image: url("' + sFavIcon + '");');
                oItem.setAttribute('hidden', 'false');

                //Add an entry to the search array.
                WSProAddSearchEntry(this.aFreeSearchEngines[iIndex][0], this.aFreeSearchEngines[iIndex][1]);
            }
        }
    }
    
    setTimeout(function () {SelectPassedFSEIDs();}, 250);
}

function SelectPassedFSEIDs()
{
    var oList = document.getElementById('wspro-qts-selectedengines');
    var oItem, oCItem;
    var iPIndex, iPLen = this.aPassedFSEIDs.length;

    oList.suppressOnSelect = true;
    for (iPIndex = 0; iPIndex < iPLen; iPIndex ++)
    {
        oItem = document.getElementById('qts-' + this.aPassedFSEIDs[iPIndex]);
        if (oItem) {
            oCItem = oList.removeChild(oItem);
            oList.insertBefore(oCItem, oList.firstChild);
            oList.addItemToSelection(oCItem);
        }
    }
    oList.suppressOnSelect = false;
    WSProQTSEngineSelect(oList);
    WSProSelectedEnginesToLabel(oList);
    this.aDynamicSearchParams = this.aPassedDynamicSearchParams;
    this.WSProQTSPopulateDynamicSearchTerms();
    setTimeout(function() {WSProSetFocus();}, 10);
}

function WSProSetFocus()
{
    var oSETextBox = document.getElementById("searchengine");
    if (oSETextBox.value != "") {
        document.getElementById("dynamicsearchparams").childNodes[0].childNodes[1].focus();
        document.getElementById("dynamicsearchparams").childNodes[0].childNodes[1].select();
    } else {
        oSETextBox.focus();
        oSETextBox.select();
    }
}

function WSProEnsureElementIsVisible(sFSEID)
{
    var oList = document.getElementById('wspro-qts-selectedengines');
    oList.ensureElementIsVisible(document.getElementById('qts-' + sFSEID));
}

function WSProQTSSelectRelativeSearchGroup(bUp)
{
    var oList = document.getElementById('wspro-qts-selectedengines');
    var oElement, oRElement;

    oElement = oList.selectedItem;

    if (oElement)
    {
        if (bUp) oRElement = oElement.previousSibling;
        else  oRElement = oElement.nextSibling;

        if (oRElement)
        {
            oList.selectItem(oRElement);
            oList.ensureElementIsVisible(oRElement);
            WSProSelectedEnginesToLabel(oList);
        }
    }
}

function WSProQTSEngineSelect(oList)
{
    if (!this.bIsTyping && oList.selectedItem)
    {
        WSProSelectedEnginesToLabel(oList);
    }
    this.WSProQTSPopulateDynamicSearchTerms();
}

function WSProSelectedEnginesToLabel(oList)
{
    var oItem
    var sFSEID = "";
    var sDisplayLabel = "";
    var iIndex, iLen = oList.getRowCount();
    var iKIndex, iKLen = this.aSearchKeys.length;

    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        oItem = oList.getItemAtIndex(iIndex);
        sFSEID = "";
        if (oItem.selected) sFSEID = oItem.getAttribute('fseid');
        if (sFSEID && sFSEID != "")
        {
            sFSEID = sFSEID.replace("qts-", "");
            for (iKIndex = 0; iKIndex < iKLen; iKIndex ++)
            {
                if (sFSEID == this.aSearchKeys[iKIndex][0])
                {
                    if (sDisplayLabel != "") sDisplayLabel += ",";
                    sDisplayLabel += this.aSearchKeys[iKIndex][7];
                }
            }
        }
    }

    if (sDisplayLabel == "" && oList.selectedItem) sDisplayLabel = oList.selectedItem.label;
    document.getElementById('searchengine').value = sDisplayLabel;
}

function WSProInitFreeSearchGroups()
{
    //Initialize the free search groups array
    this.aFreeSearchGroups = null;
    this.aFreeSearchGroups = new Array();

    var aTemp = new Array();
    var aGroup;
    var bCheckHide = this.oUtils.GetBool("mmsearch-hidewsprosystemgroups");
    aTemp = this.oUtils.GetLocalizedString("mmsearch-freesearchgroups").split('f_g');
    var iIndex, iGroupIndex, iLen = aTemp.length;

    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        if (aTemp[iIndex] != "")
        {
            aGroup = aTemp[iIndex].split('f_v');
            if (!bCheckHide || !WSProCheckRemoveSG(aGroup[0]))
            {
                iGroupIndex = this.aFreeSearchGroups.length;
                this.aFreeSearchGroups[iGroupIndex] = new Array();
                this.aFreeSearchGroups[iGroupIndex] = aGroup;
            }
        }
    }
}

function WSProInitFreeSearchEngines()
{
    //Initialize the free search engines array
    this.aFreeSearchEngines = null;
    this.aFreeSearchEngines = new Array();

    var aTemp = new Array();
    aTemp = this.oUtils.GetLocalizedString("mmsearch-freesearchengines").split('f_e');
    var iIndex, iLen = aTemp.length;

    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        if (aTemp[iIndex] != "")
        {
            this.aFreeSearchEngines[iIndex] = new Array();
            this.aFreeSearchEngines[iIndex] = aTemp[iIndex].split('f_v');
        }
    }
}

function CloseWindow()
{
    this.oUtils = null;
    this.aFreeSearchEngines = null;
    this.aFreeSearchGroups = null;

    window.close();
}

function QTSSearch(oEvent)
{
    var oItem, oList = document.getElementById('wspro-qts-selectedengines');
    var aFSEIDs = new Array();
    var sFSEID = "", sText = "";
    var iIndex, iLen = oList.getRowCount();
    
    //Repopulate dynamic search terms for the current textboxes
    WSProQTSPopulateDynamicSearchParamValues();

    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        oItem = oList.getItemAtIndex(iIndex);
        sFSEID = "";
        if (oEvent && oEvent.ctrlKey)
        {
            if (oItem.getAttribute('disabled') == 'false') sFSEID = oItem.getAttribute('fseid');
        }
        else
        {
            if (oItem.selected) sFSEID = oItem.getAttribute('fseid');
        }
        if (sFSEID != "")
        {
            window.opener.WSProOverlay.sLastQTSSearchTerm = sText;
            aFSEIDs[aFSEIDs.length] = sFSEID;
            window.opener.WSProOverlay.sCurrentSearchType = "qts";
            window.opener.WSProOverlay.MMToolbarSearch(sText, sFSEID, false, this.aDynamicSearchParams);
        }
    }
    
    window.opener.WSProOverlay.aLastQTSSearchEngines = aFSEIDs;
    window.opener.WSProOverlay.aLastQTSDynamicSearchParams = this.aDynamicSearchParams;

    CloseWindow();
}

function QTSClear()
{
    oTextboxes = document.getElementsByAttribute("class", "searchterms");
    var iIndex, iLen = oTextboxes.length;
    
    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        if (oTextboxes[iIndex]) oTextboxes[iIndex].value = "";
    }
}

function WSProQTSFocus(bGotFocus, oElement)
{
    if (bGotFocus) oElement.select();

    this.bIsTyping = bGotFocus;
}

function WSProHandleQTSKeyUp(oElement, oEvent)
{
    WSProQTSPopulateDynamicSearchParamValue(oElement);
    
    if (oEvent.keyCode == 9) return null; //VK_TAB
    if (oEvent.keyCode == 13) return QTSSearch(oEvent); //VK_RETURN
    if (oEvent.keyCode == 27) return CloseWindow(oEvent); //VK_ESC
    if (oElement.id == "searchengine")
    {
        if (oEvent.keyCode == 38)
        {
            return WSProQTSSelectRelativeSearchGroup(true); //VK_UP
        }
        if (oEvent.keyCode == 40)
        {
            return WSProQTSSelectRelativeSearchGroup(false); //VK_DOWN
        }
    }

    if (oElement.id == "searchengine") WSProProcessQTSSearchKeys(oElement.value);
}

function WSProHandleQTSKeyUpEngines(oElement, oEvent)
{
    if (oEvent.keyCode == 13) return QTSSearch(oEvent); //VK_RETURN
    if (oEvent.keyCode == 27) return CloseWindow(oEvent); //VK_ESC
    if (oEvent.keyCode == 38)
    {
        return WSProQTSSelectRelativeSearchGroup(true); //VK_UP
    }
    if (oEvent.keyCode == 40)
    {
        return WSProQTSSelectRelativeSearchGroup(false); //VK_DOWN
    }
}

function WSProProcessQTSSearchKeys(sSearchTerm)
{
    var oItem, oCItem, oList = document.getElementById('wspro-qts-selectedengines');
    var aSearchTerms;
    var aHighestScoredFSEIDs = new Array();
    var sHighestScoredFSEID = "";
    var aItemIDs = new Array();
    var iLIndex, iLLen = oList.children.length;
    var iIndex, iLen = this.aSearchKeys.length;
    var iSIndex, iSLen;
    var iScore, iHighestScore = 0;
    var bIsFirstLoop = true;

    oList.clearSelection();
    
    aSearchTerms = sSearchTerm.toLowerCase().split(',');
    iSLen = aSearchTerms.length;
    
    for (iSIndex = 0; iSIndex < iSLen; iSIndex ++)
    {
        sSearchTerm = this.oUtils.Alltrim(aSearchTerms[iSIndex]);
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            if (!sSearchTerm || sSearchTerm == "")
            {
                if (bIsFirstLoop)
                {
                    DisableItemID(aItemIDs, 'qts-' + this.aSearchKeys[iIndex][0], false);
                }
            }
            else
            {
                iScore = ScoreSearchKey(sSearchTerm, this.aSearchKeys[iIndex]);
                if (iScore > iHighestScore)
                {
                    iHighestScore = iScore;
                    sHighestScoredFSEID = this.aSearchKeys[iIndex][0];
                }
                if (iScore == 0)
                {
                    if (bIsFirstLoop)
                    {
                        DisableItemID(aItemIDs, 'qts-' + this.aSearchKeys[iIndex][0], true);
                    }
                }
                else
                {
                    DisableItemID(aItemIDs, 'qts-' + this.aSearchKeys[iIndex][0], false);
                }
            }
        }
        if (sHighestScoredFSEID != "")
        {
            aHighestScoredFSEIDs[aHighestScoredFSEIDs.length] = 'qts-' + sHighestScoredFSEID;
        }
        sHighestScoredFSEID = "";
        iHighestScore = 0;
        bIsFirstLoop = false;
    }
    
    iLen = aItemIDs.length;
    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        oItem = document.getElementById(aItemIDs[iIndex][0]);
        oItem.setAttribute('disabled', aItemIDs[iIndex][1]);
        if (aItemIDs[iIndex][1])
        {
            oCItem = oList.removeChild(oItem);
            oList.appendChild(oCItem);
        }
    }
    
    iLen = aHighestScoredFSEIDs.length;
    oList.suppressOnSelect = true;
    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        oItem = document.getElementById(aHighestScoredFSEIDs[iIndex]);
        oCItem = oList.removeChild(oItem);
        oList.insertBefore(oCItem, oList.firstChild);
        oList.addItemToSelection(oCItem);
        oList.ensureElementIsVisible(oCItem);
    }
    oList.suppressOnSelect = false;
    WSProQTSEngineSelect(oList);
}

function DisableItemID(aItemIDs, sItemID, bDisable)
{
    var iIndex, iLen = aItemIDs.length;
    var bFound = false;
    
    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        if (aItemIDs[iIndex][0] == sItemID)
        {
            aItemIDs[iIndex][1] = bDisable;
            bFound = true;
            break;
        }
    }
    if (!bFound) aItemIDs[iLen] = new Array(sItemID, bDisable);
}

function ScoreSearchKey(sSearchTerm, aSearchKey)
{
    var aSearchTerm = sSearchTerm.split(" ");
    var iScore = 0, iLastScore;
    var iIndex, iLen = aSearchKey[5].length;
    var iSLen = aSearchTerm.length;
    var iPos, iPrevPos = -1;

    if (aSearchKey[1].indexOf(sSearchTerm) >= 0) iScore += 1;
    if (aSearchKey[2].indexOf(sSearchTerm) >= 0) iScore += 1;
    if (aSearchKey[3].indexOf(sSearchTerm) >= 0) iScore += 1;
    if (aSearchKey[4].indexOf(sSearchTerm) >= 0) iScore += 1;
    for (iIndex = 0; iIndex < iSLen; iIndex ++)
    {
        if (iIndex < iLen && aSearchKey[5][iIndex].indexOf(aSearchTerm[iIndex]) >= 0)
        {
            iScore += 0.2;
        }
    }
    iLastScore = iScore;
    iSLen = sSearchTerm.length;
    for (iIndex = 0; iIndex < iSLen; iIndex ++)
    {
        iPos = aSearchKey[1].indexOf(sSearchTerm.substr(iIndex, 1), iPrevPos + 1);
        if (iPos >= 0 && iPos > iPrevPos)
        {
            iPrevPos = iPos;
            iScore += 0.2;
        }
        else
        {
            iScore = iLastScore;
            break;
        }
    }
    if (aSearchKey[6].indexOf(sSearchTerm) >= 0) iScore += 1;

    /*Exact matches*/
    if (aSearchKey[1] == sSearchTerm) iScore += 1;
    if (aSearchKey[2] == sSearchTerm) iScore += 1;
    if (aSearchKey[3] == sSearchTerm) iScore += 1;
    if (aSearchKey[4] == sSearchTerm) iScore += 1;
    if (aSearchKey[6] == sSearchTerm) iScore += 1;
    if (aSearchKey[7] == sSearchTerm) iScore += 1;
    return iScore;
}

function WSProAddSearchEntry(sFSEID, sLabel)
{
    //{fseid, normal label, vowelless label, first characters only, uppercase characters only, vowelless label words array, excact original label, unique smart abbreviation}
    var aLabel;
    var sLowerLabel = "";
    var sUpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var iIndex, iLen;
    var iNewIndex = this.aSearchKeys.length;

    sLowerLabel = sLabel.toLowerCase();
    sLowerLabel = sLowerLabel.replace(/\(/g, "");
    sLowerLabel = sLowerLabel.replace(/\)/g, "");
    sLowerLabel = sLowerLabel.replace(/\-/g, "");
    sLowerLabel = sLowerLabel.replace(/\&/g, "");
    sLowerLabel = sLowerLabel.replace(/\//g, "");
    sLowerLabel = sLowerLabel.replace(/\'/g, "");
    sLowerLabel = sLowerLabel.replace(/\"/g, "");
    sLowerLabel = sLowerLabel.replace(/  /g, " ");
    sLowerLabel = sLowerLabel.replace(/\./g, " ");

    aLabel = sLowerLabel.split(" ");

    this.aSearchKeys[iNewIndex] = new Array();
    this.aSearchKeys[iNewIndex][0] = sFSEID;
    this.aSearchKeys[iNewIndex][1] = sLowerLabel;
    this.aSearchKeys[iNewIndex][2] = sLowerLabel.replace(/[aeioujy]/g, "");
    this.aSearchKeys[iNewIndex][3] = "";
    this.aSearchKeys[iNewIndex][4] = "";
    this.aSearchKeys[iNewIndex][5] = new Array();
    this.aSearchKeys[iNewIndex][6] = sLabel.toLowerCase();
    this.aSearchKeys[iNewIndex][7] = "";

    iLen = aLabel.length;
    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        this.aSearchKeys[iNewIndex][3] += aLabel[iIndex].substr(0, 1);
    }
    iLen = sLabel.length;
    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        if (sUpperCase.indexOf(sLabel.substr(iIndex, 1)) >= 0)
        {
            this.aSearchKeys[iNewIndex][4] += sLabel.substr(iIndex, 1).toLowerCase();
        }
        if (sLabel.substr(iIndex, 1) == " ")
        {
            this.aSearchKeys[iNewIndex][4] += " ";
        }
    }
    iLen = aLabel.length;
    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        this.aSearchKeys[iNewIndex][5][iIndex] = aLabel[iIndex].replace(/a/g, "");
        this.aSearchKeys[iNewIndex][5][iIndex] = this.aSearchKeys[iNewIndex][5][iIndex].replace(/e/g, "");
        this.aSearchKeys[iNewIndex][5][iIndex] = this.aSearchKeys[iNewIndex][5][iIndex].replace(/i/g, "");
        this.aSearchKeys[iNewIndex][5][iIndex] = this.aSearchKeys[iNewIndex][5][iIndex].replace(/o/g, "");
        this.aSearchKeys[iNewIndex][5][iIndex] = this.aSearchKeys[iNewIndex][5][iIndex].replace(/u/g, "");
        this.aSearchKeys[iNewIndex][5][iIndex] = this.aSearchKeys[iNewIndex][5][iIndex].replace(/ij/g, "");
        this.aSearchKeys[iNewIndex][5][iIndex] = this.aSearchKeys[iNewIndex][5][iIndex].replace(/y/g, "");
    }
    
    var sUSK = this.aSearchKeys[iNewIndex][3];
    var iUIndex = GetUniqueSearchKey(sUSK, 0);
    if (iUIndex != 0) sUSK += iUIndex;
    this.aSearchKeys[iNewIndex][7] = sUSK;
}

function GetUniqueSearchKey(sUSK, iUIndex)
{
    var sCUSK = sUSK;
    if (iUIndex != 0) sCUSK += iUIndex;
    var iIndex, iLen = this.aSearchKeys.length - 1; //-1 cause we want to find the unique key for this newly added key.
    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        if (this.aSearchKeys[iIndex][3] == sCUSK)
        {
            iUIndex += 1;
            return GetUniqueSearchKey(sUSK, iUIndex);
        }
    }
    return iUIndex;
}

function WSProQTSPopulateDynamicSearchTerms()
{
    var oVBox = document.getElementById("dynamicsearchparams");
    this.oUtils.RemoveAllChildren(oVBox, "searchusing_box,searchusing_label,searchengine,bottomspacer,qtssearch,qtsclear");

    WSProQTSPopulateDynamicSearchParams();

    var oHBox, oLabel, oTextBox;
    var iIndex, iLen = this.aDynamicSearchParams.length;
    for (iIndex = 0; iIndex < iLen; iIndex++)
    {
        if (this.aDynamicSearchParams[iIndex][1] != "")
        {
            oHBox = document.getElementById("searchterms_clone").cloneNode(true);
            oHBox.setAttribute("id", "dsph_" + iIndex);
            oHBox.removeAttribute("hidden");

            oLabel = oHBox.childNodes[0];
            oLabel.setAttribute("id", "dspl_" + iIndex);
            oLabel.setAttribute("value", this.aDynamicSearchParams[iIndex][1] + ":");

            oTextBox = oHBox.childNodes[1];
            oTextBox.setAttribute("id", "dspt_" + iIndex);
            if (this.aDynamicSearchParams[iIndex][2] == "" && window.arguments[0].sLastQTSSearchTerm != "")
            {
                this.aDynamicSearchParams[iIndex][2] = window.arguments[0].sLastQTSSearchTerm;
            }
            oTextBox.setAttribute("value", this.aDynamicSearchParams[iIndex][2]);

            oVBox.insertBefore(oHBox, oVBox.lastChild);
        }
    }
    document.getElementById('searchtext').value = "";
}

function WSProQTSPopulateDynamicSearchParams()
{
    var aCurrentDynamicSearchParams = this.aDynamicSearchParams;
    this.aDynamicSearchParams = new Array();

    var oItem, oList = document.getElementById('wspro-qts-selectedengines');
    var sFSEID, sGroupID;
    var iIndex, iLen = oList.getRowCount();
    var iFIndex, iFLen = this.aFreeSearchEngines.length;

    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        oItem = oList.getItemAtIndex(iIndex);
        sFSEID = "";
        if (oItem.selected)
        {
            sFSEID = oItem.getAttribute('fseid');
            sGroupID = oItem.getAttribute('id').replace("qts-", "");
        }
        if (sFSEID != "" || sGroupID != "")
        {
            for (iFIndex = 0; iFIndex < iFLen; iFIndex ++)
            {
                /*ID or group ID match*/
                if (this.aFreeSearchEngines[iFIndex][0] == sFSEID || this.aFreeSearchEngines[iFIndex][3] == sGroupID)
                {
                    if (this.aFreeSearchEngines[iFIndex][2].indexOf("{searchTerms") == -1) this.aFreeSearchEngines[iFIndex][2] = this.aFreeSearchEngines[iFIndex][2] + "{searchTerms}";
                    AddDynamicSearchParam(this.aFreeSearchEngines[iFIndex][2].match(/\{searchTerms??(.+?)\}/g));
                }
            }
        }
    }
    
    if (this.aDynamicSearchParams.length == 0)
    {
        AddDynamicSearchParam(new Array("{searchTerms}"));
    }
    
    iLen = this.aDynamicSearchParams.length;
    if (aCurrentDynamicSearchParams)
    {
        iFLen = aCurrentDynamicSearchParams.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            for (iFIndex = 0; iFIndex < iFLen; iFIndex ++)
            {
                if (this.aDynamicSearchParams[iIndex][0] == aCurrentDynamicSearchParams[iFIndex][0])
                {
                    this.aDynamicSearchParams[iIndex][2] = aCurrentDynamicSearchParams[iFIndex][2];
                }
            }
        }
    }
}

function WSProQTSPopulateDynamicSearchParamValues()
{
    oTextboxes = document.getElementsByAttribute("class", "searchterms");
    var iIndex, iLen = oTextboxes.length;
    
    for (iIndex = 0; iIndex < iLen; iIndex ++)
    {
        if (oTextboxes[iIndex]) WSProQTSPopulateDynamicSearchParamValue(oTextboxes[iIndex]);
    }
}

function WSProQTSPopulateDynamicSearchParamValue(oTextBox)
{
    if (!oTextBox) return;
    var iIndex = parseInt(oTextBox.getAttribute("id").replace("dspt_", ""));
    if (isNaN(iIndex) || iIndex > (this.aDynamicSearchParams.length - 1)) return;
    
    this.aDynamicSearchParams[iIndex][2] = oTextBox.value;
}

function AddDynamicSearchParam(aSearchTerms)
{
    var sLabel;
    var iIndex, iLen = this.aDynamicSearchParams.length;
    var iSIndex, iSLen = aSearchTerms.length;
    var bFound;

    for (iSIndex = 0; iSIndex < iSLen; iSIndex ++)
    {
        bFound = false;
        iLen = this.aDynamicSearchParams.length;
        for (iIndex = 0; iIndex < iLen; iIndex ++)
        {
            if (this.aDynamicSearchParams[iIndex][0] == aSearchTerms[iSIndex])
            {
                bFound = true;
                break;
            }
        }
        if (!bFound)
        {
            iIndex = this.aDynamicSearchParams.length;
            sLabel = aSearchTerms[iSIndex]
            sLabel = sLabel.replace(/{searchTerms /g, "");
            sLabel = sLabel.replace(/{searchTerms/g, "");
            sLabel = sLabel.replace(/}/g, "");
            if (sLabel == "") sLabel = this.oUtils.TranslateString('wspro-qts-searchterms');
            this.aDynamicSearchParams[iIndex] = new Array(aSearchTerms[iSIndex], sLabel, "");
        }
    }
}

function WSProQTSStartDrag(oEvent)
{
    document.addEventListener('mousemove', WSProQTSDoDrag, true);
    document.addEventListener('mouseup', WSProQTSStopDrag, true);
    oEvent.preventDefault();
}

function WSProQTSDoDrag(oEvent)
{
    var oElement = document.getElementById('wspro-qts');
    oElement.style.left = (oEvent.clientX + window.scrollX - 250) + 'px';
    oElement.style.top  = (oEvent.clientY + window.scrollY - 7) + 'px';
    oEvent.preventDefault();
}

function WSProQTSStopDrag(oEvent)
{
    document.removeEventListener('mousemove', WSProQTSDoDrag, true);
    document.removeEventListener('mouseup', WSProQTSStopDrag, true);
}

function WSProCompareLabel(a1, a2)
{
    if (a1[1] < a2[1]) return -1;
    return 1;
}

function WSProCompareTypeAndLabel(a1, a2)
{
    if (a1[3] + a1[1] < a2[3] + a2[1]) return -1;
    return 1;
}

function WSProCheckRemoveSG(sFSEID)
{
    var iIndex, iLen = this.aFreeSearchEngines.length;

    for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aFreeSearchEngines[iIndex][3] == sFSEID) return false;}
    return true;
}

