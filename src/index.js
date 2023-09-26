// First version was made on 08/06/2020 - 14/06/2020
import auth from "solid-auth-client";
import { fetchDocument, createDocument } from 'tripledoc';
import { solid, schema, space, rdf, foaf, acl, skos, dc, dct, vcard } from 'rdf-namespaces';

import data from "@solid/query-ldflex";
import { literal, namedNode } from "@rdfjs/data-model";

import { sign } from "tweetnacl";
import { decodeUTF8, encodeBase64, decodeBase64 } from "tweetnacl-util";

import fetch from "node-fetch";
import { DeliveryEvent } from "rdf-namespaces/dist/schema";



// Global variables
var registerFileURL = "https://chang.inrupt.net/registerlist/requestlist.ttl";
var registerParticipationFolder = "https://chang.inrupt.net/registerlist/participationlistv2/";
var registerTriggerMessageFolder = "https://chang.inrupt.net/inbox/triggermessage/";
var podServerURL = "https://chang.inrupt.net/profile/card#me";
var registerIndexRef = "https://chang.inrupt.net/settings/registerIndex.ttl";
var userRegisterRef = "https://chang.inrupt.net/registerlist/userregister.ttl";
var dataFileName = "healthrecord.ttl";

// Global terminology
var requestTitleLabelGlobal = "http://schema.org/title";
var requestPurposeClassGlobal = "http://www.w3.org/ns/dpv#hasPurpose";
var requestPurposeLabelGlobal = "http://www.w3.org/2000/01/rdf-schema#label";
var requestDataCategoryGlobal = "http://www.w3.org/ns/dpv#hasPersonalDataCategory";

var requestDataElementGlobal = "http://schema.org/DataFeedItem";
var requestExpiryGlobal = "http://www.w3.org/ns/dpv#hasExpiryTime";
var requestCollectionSizeGlobal = "http://schema.org/collectionSize";
var requestDataProcessGlobal = "http://www.w3.org/ns/dpv#hasProcessing";
var requestAnalysisLogicGlobal = "http://www.w3.org/ns/dpv#hasAlgorithmicLogic";
var requestConsequenceGlobal = "http://www.w3.org/ns/dpv#hasConsequences";
var requestDataControllerGlobal = "http://www.w3.org/ns/dpv#hasDataController";
var requestPersonalDataHandlingGlobal = "http://www.w3.org/ns/dpv#PersonalDataHandling";
var requestParticipation = "http://www.w3.org/ns/dpv#participation"

var joinActionGlobal = "http://schema.org/JoinAction";
var joinConsentGlobal = "http://www.w3.org/ns/dpv#Consent";
var joinConsentNoticeGlobal = "http://www.w3.org/ns/dpv#hasConsentNotice";
var joinDataSubjectGlobal = "http://www.w3.org/ns/dpv#DataSubject";
var joinDataCreatedGlobal = "http://schema.org/dateCreated";
var joinhasProvisionTimeGlobal = "http://www.w3.org/ns/dpv#hasProvisionTime";
var joinhasProvisionMethodGlobal = "http://www.w3.org/ns/dpv#hasProvisionMethod";
var joinhasWithdrawalTimeGlobal = "http://www.w3.org/ns/dpv#hasWithdrawalTime";
var joinhasWithdrawalMethodGlobal = "http://www.w3.org/ns/dpv#hasWithdrawalMethod";
var joinDataRecipientGlobal = "http://www.w3.org/ns/dpv#hasRecipient";
var joinhasExpiryGlobal = "http://www.w3.org/ns/dpv#hasExpiry";
var joinhasExpiryTimeGlobal = "http://www.w3.org/ns/dpv#hasExpiryTime";




// query all button values
const btns = document.querySelectorAll(".listen.button");
const btn_login = document.querySelectorAll(".login.button");
const searchIcons = document.querySelectorAll(".link");

/* Auto-run based on different page (START) */
var page = window.location.pathname.split("/").pop();
if (page === "cmlparticipate.html") {

    fetchRequestURL(registerFileURL).then(fetchRegisterRecord => {
        fetchRegisterList(fetchRegisterRecord).then(fetchedRequestAndWebId => {

            const requestURIList = fetchedRequestAndWebId[0]
            const requestWebIdDocList = fetchedRequestAndWebId[1]
            const requestProfileIdList = fetchedRequestAndWebId[2]

            auth.currentSession().then(session => {
                const participant_webID = session.webId;
                const participant_dataFile = participant_webID.split("profile/card#")[0] + "private/" + dataFileName;
                const participant_basket = []
   
                
                // fetchRequestURL(participant_dataFile).then(fetchedParticipantDataFileRef => {
                //     const participant_triple = fetchedParticipantDataFileRef.getTriples()
                //     participant_triple.forEach(eachDataItem => {
                //         participant_basket.push(eachDataItem.predicate.id);
                //     });
                plotCardsOnPage(requestWebIdDocList, requestProfileIdList, requestURIList, "fromPageEntrance", "participant", session, participant_basket).then(outcome => {
                    respondToRequest(outcome[0], outcome[1]);
                });
                // });

            });
        }).catch(error => console.log(error));;
    });
} else if (page === 'cmlfetch.html') {
    // Fetch data from the files all triples or objects


    var fetchFrom = "https://janjansen.solidcommunity.net/private/healthrecordforpatient.ttl"//document.getElementById("fetchFromTriples").value;


    const fetchSubject = "https://janjansen.solidcommunity.net/profile/card#me"//document.getElementById("fetchSubject").value;
    const fetchPredicate = "http://xmlns.com/foaf/0.1/name"//document.getElementById("fetchPredicate").value;
    const getTriplesOption = true //styles.contains('fetchTriples');

    getTriplesObjects(fetchFrom, fetchSubject, fetchPredicate, getTriplesOption).then(getFetchedData => {
        const tables = document.querySelectorAll(".table");

        // print the triples as "subject" "predicate" "object"
        let tripleResults = [];

        let tableHeaderElements = ["http://schema.org/DataFeedItem", "http://schema.org/value", "http://schema.org/definedTerm", "http://www.w3.org/ns/dpv#hasPersonalDataCategory","http://www.w3.org/ns/dpv#hasDataController"]
        for (let i = 0; i < getFetchedData.length; i+=5) {
            tripleResults.push({
                Variable: getFetchedData[i+0].object.id,
                Value: getFetchedData[i+1].object.id,
                Definition: getFetchedData[i+2].object.id,
                Category: getFetchedData[i+3].object.id,
                ManagedBy: getFetchedData[i+4].object.id
            })
            //tripleResults.push({ Subject: getFetchedData[i].subject.id, Predicate: getFetchedData[i].predicate.id, Object: getFetchedData[i].object.id })
        }
        tables.forEach(function (table) {
            if (table.classList.contains("triples")) {
                printTable(table, tripleResults, false);
            }
        });
    });

}
/* Auto-run based on different page (END) */



//*** Participant sends feedback msg to researcher (START) ***//
async function sendFeedbackMsg(feedback_request_ID, feedback_researcher_webid, feedback_participant_webid, feedback_text) {

    // Create a new message ttl file in inbox
    const feedbackMsgLocation = feedback_researcher_webid.split("profile/card#")[0] + "inbox/" + feedback_request_ID.split("#")[1] + ".ttl";
    // console.log(feedbackMsgLocation)
    //data[feedbackMsgLocation].put()
    //// Create the message content
    let random_sub = '';
    for (let i = 0; i < 19; ++i) random_sub += Math.floor(Math.random() * 10);

    await solid.data[random_sub][rdf.type].add(namedNode(schema.Message));
    await solid.data[random_sub][schema.text].add(literal(feedback_text));
    await solid.data[random_sub][schema.about].add(namedNode(feedback_request_ID));
    await solid.data[random_sub][schema.sender].add(namedNode(feedback_participant_webid));
    await solid.data[random_sub][schema.recipient].add(namedNode(feedback_researcher_webid));
    const currentDateTime = new Date(Date.now())
    await solid.data[random_sub][schema.dateSent].add(literal(currentDateTime.toISOString(), "http://www.w3.org/2001/XMLSchema#dateTime"));
    return "Got it! Your feedback message has been sent to the researchers pod inbox!"
}
//*** Participant sends feedback msg to researcher (END) ***//

// ****** Log In and Log Out (START) *********//
async function getWebId() {

    /* 1. Check if we've already got the user's WebID and access to their Pod: */
    let session = await auth.currentSession();
    if (session) {
        return session.webId;
    }
    else {
        /* 2. User has not logged in; ask for their Identity Provider: */
        const identityProvider = await getIdentityProvider();

        /* 3. Initiate the login process - this will redirect the user to their Identity Provider: */
        auth.login(identityProvider);
    }
}

// login using inrupt or solid community identity providers 
function getIdentityProvider() {
    const idpPromise = new Promise((resolve, _reject) => {
        btns.forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                const styles = e.currentTarget.classList;

                if (styles.contains('inrupt')) {
                    resolve("https://inrupt.net");
                    console.log("Login Inrupt");
                }
                else if (styles.contains('solidcommunity')) {
                    resolve("https://solidcommunity.net");
                    console.log("Login Solid Community");
                }
            });
        });
    });
    return idpPromise
}

getWebId().then(webId => {

    const homeMessageElement = document.getElementById("homeMessage");
    if (webId) {
        let currentPath = window.location.pathname.toString().split("dist/");
        if (currentPath[1] === "cmlconsent.html") { window.location.href = currentPath[0] + "dist/cmlparticipate.html"; }
        if (homeMessageElement) { homeMessageElement.textContent = "Welcome! " + "Jan Janssen"; }

        //if (currentPath[1] === "cmlconsent.html") {
        // document.getElementById("logStatusPage").textContent = "Log Out";
        // document.getElementById("logStatusFollowing").textContent = "Log Out";
        //}

        // ***** Log out ***** //
        btn_login.forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                const styles = e.currentTarget.classList;
                if (styles.contains('login')) {
                    auth.logout().then(() => alert('See you soon!'))
                    window.location.href = "cmlconsent.html";
                }
            });
        });
    }
    else {
        if (homeMessageElement) { homeMessageElement.textContent = "Directing to log-in page..." }
        // document.getElementById("logStatusPage").textContent = "Log In";
        // document.getElementById("logStatusFollowing").textContent = "Log In";
    }
});
// ****** Log In and Log Out (END) *********//


// ****** Fetch data from Pod (START) *********//
async function getTriplesObjects(fetchFrom, fetchSubject, fetchPredicate, option) {

    /* 1. Fetch the Document at `webId`: */
    try {
        const fetchFromDoc = await fetchDocument(fetchFrom);
    }
    catch (err) {
        alert(err.message);
    }
    finally {

        const fetchFromDoc = await fetchDocument(fetchFrom);

        if (option) {
            /* 2. Read the Subject representing the current user's profile: */
            const getTriples = fetchFromDoc.getTriples();
            return getTriples
        }

        else {
            /* 3. Get their triples or objects */
            const getSubject = fetchFromDoc.getSubject(fetchSubject);
            if (fetchPredicate) {
                const getObjects = getSubject.getAllLiterals(fetchPredicate).concat(getSubject.getAllRefs(fetchPredicate));
                return getObjects
            }
            else {
                const getObjects = getSubject.getTriples()
                return getObjects
            }
        }
    }
}
// ****** Fetch data from Pod (END) *********//


// *** Generate table for request cards (START) ***//
function generateTableHead(table, data)  {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let key of data) {
        let th = document.createElement("th");
        let text = document.createTextNode(key);
        th.appendChild(text);
        row.appendChild(th);
    }
}

function generateTable(table, data) {
    for (let element of data) {
        let row = table.insertRow();
        for (let key in element) {
            let cell = row.insertCell();
            let input = element[key]

            let regex = /"(.*?)"/g;
            let matches = input.match(regex);

            if (matches) {
                let textBetweenQuotes = matches.map(match => match.replace(/"/g, ''));
                let text = document.createTextNode(textBetweenQuotes);
                cell.appendChild(text);

            } else {
                let href_text = document.createElement("a");
                if (input.includes("#")) {
                    const text = document.createTextNode(input.toString().split("#")[1]);
                    href_text.appendChild(text)
                } else {
                    let pieces = input.split("/");
                    const text = document.createTextNode(pieces[pieces.length - 2] + ":" + pieces[pieces.length - 1]);
                    href_text.appendChild(text)
                }
                
                //href_text.appendChild(text)
                href_text.href = input

                cell.appendChild(href_text);
            }

            
        }
    }
}

function printTable(table, tripleResults, append) {
    let data = Object.keys(tripleResults[0]);
    if (!append) {
        while (table.hasChildNodes()) { table.removeChild(table.firstChild); }
    }
    if (!table.hasChildNodes()) {
        generateTableHead(table, data);
    }
    generateTable(table, tripleResults);
}
// *** Generate table for request cards (END) ***//

// *** Setting up a reading and creating data model (START) ***//
async function getNotesList(profileHead, fileLocation, fileName) {
    const fetchProfile = profileHead + "profile/card#me";
    const webIdDoc = await fetchDocument(fetchProfile);
    const profile = webIdDoc.getSubject(fetchProfile);

    /* 1. Check if a Document tracking our notes already exists. */
    if (fileLocation.includes("public")) {
        var pubPriTypeIndexRef = profile.getRef(solid.publicTypeIndex);
        var predicateIndex = "public/" + fileName;
    }
    else if (fileLocation.includes("private")) {
        var pubPriTypeIndexRef = profile.getRef(solid.privateTypeIndex);
        var predicateIndex = "private/" + fileName;
    }

    const pubPriTypeIndex = await fetchDocument(pubPriTypeIndexRef);
    const notesListEntry = pubPriTypeIndex.findSubject(solid.instance, profileHead + predicateIndex);//schema.TextDigitalDocument

    /* 2. If it doesn't exist, create it. */
    if (notesListEntry === null) {
        // We will define this function later:
        return initialiseNotesList(profile, pubPriTypeIndex, predicateIndex).then(() => alert("New file " + predicateIndex + " is created!"));
    }

    /* 3. If it does exist, fetch that Document. */
    const notesListRef = notesListEntry.getRef(solid.instance);


    return await fetchDocument(notesListRef);
}


async function initialiseNotesList(profile, typeIndex, predicateIndex) {
    // Get the root URL of the user's Pod:
    const storage = profile.getRef(space.storage);

    // Decide at what URL within the user's Pod the new Document should be stored:
    const notesListRef = storage + predicateIndex;

    // Create the new Document:
    const notesList = createDocument(notesListRef);
    await notesList.save();

    // Store a reference to that Document in the public Type Index for `schema:dataFeedElement`:
    const typeRegistration = typeIndex.addSubject();
    typeRegistration.addRef(rdf.type, solid.TypeRegistration)
    typeRegistration.addRef(solid.instance, notesList.asRef())
    typeRegistration.addRef(solid.forClass, schema.dataFeedElement)
    await typeIndex.save([typeRegistration]);

    // And finally, return our newly created (currently empty) notes Document:
    return notesList;
}

// Add note in the file 
async function addNote(profileHead, addedTableDict, notesList) {

    const fetchProfile = profileHead + "profile/card#me";
    // Initialise the new Subject:
    const newDataElement = notesList.addSubject();
    // Indicate that the Subject is a schema:dataFeedElement:
    newDataElement.addRef(rdf.type, schema.dataFeedElement);
    // Set the Subject's `schema:text` to the actual note contents:
    // Store the date the note was created (i.e. now):
    newDataElement.addDateTime(schema.dateCreated, new Date(Date.now()));

    newDataElement.addRef(schema.creator, fetchProfile);
    newDataElement.addRef(requestDataControllerGlobal, fetchProfile);

    for (let i = 0; i < addedTableDict.length; i++) {
        let predicateItem = addedTableDict[i].Predicate
        let objectItem = addedTableDict[i].Object
        if (Number(objectItem)) {
            if (Number(objectItem) === parseInt(objectItem, 10)) {
                newDataElement.addInteger(predicateItem, parseInt(objectItem));
            }
            else {
                newDataElement.addDecimal(predicateItem, parseFloat(objectItem));
            }
        }
        else if (objectItem.includes("http://") || objectItem.includes("https://")) {
            newDataElement.addRef(predicateItem, objectItem);
        }
        else {
            try {
                newDataElement.addDateTime(predicateItem, new Date(objectItem));
            } catch {
                newDataElement.addString(predicateItem, objectItem);
            }
        };
    }
    const success = await notesList.save([newDataElement]);
    return success;
}
// *** Setting up a reading and creating data model (END) ***//

// *** Register a new user and generate key pairs (START) ***//
async function generatePublicKeyPair(fetchProfile, userName, affiliance) {

    const webIdDoc = await fetchDocument(fetchProfile);
    const profile = webIdDoc.getSubject(fetchProfile);

    /* 1. Check if a Document tracking our registration already exists. */
    const privateTypeIndexRef = profile.getRef(solid.privateTypeIndex);
    const privateTypeIndex = await fetchDocument(privateTypeIndexRef);
    const userAuthEntryList = privateTypeIndex.findSubjects(solid.forClass, schema.RegisterAction);//schema.TextDigitalDocument

    /* 2. If it doesn't exist, create it. */
    if (userAuthEntryList.length == 0) {
        initialiseRegisteredUser(profile, privateTypeIndex, userName, affiliance).then(response => {
            alert(response)
            return response;
        });
    }
    else {
        return "You have registered already!"
    }
}

async function initialiseRegisteredUser(profile, typeIndex, userName, affiliance) {

    // Generate public-private key pairs
    const publicPrivateKeyPair = sign.keyPair();
    const publicKey = encodeBase64(publicPrivateKeyPair.publicKey);
    const privateKey = encodeBase64(publicPrivateKeyPair.secretKey);

    // Get the root URL of the user's Pod:
    const storage = profile.getRef(space.storage);

    // Create the new Document:
    const registerList = createDocument(storage + 'private/registration.ttl');
    const registerUser = registerList.addSubject();
    registerUser.addRef(rdf.type, schema.RegisterAction);
    registerUser.addString(schema.name, userName);
    registerUser.addString(schema.affiliation, affiliance);
    registerUser.addString("http://schema.org/hasCredential", privateKey);
    await registerList.save([registerUser]);

    // Add public key to app server pod
    await solid.data[userRegisterRef + '#' + storage + 'profile/card#me']["http://schema.org/hasCredential"].add(literal(publicKey));

    // Store a reference to that Document in the public Type Index for `schema:dataFeedElement`:
    const typeRegistration = typeIndex.addSubject();
    typeRegistration.addRef(rdf.type, solid.TypeRegistration);
    typeRegistration.addRef(solid.instance, registerList.asRef());
    typeRegistration.addRef(solid.forClass, schema.RegisterAction);
    await typeIndex.save([typeRegistration]);
    return "Successfully registered!";
}
// *** Register a new user and generate key pairs (END) ***//


// *** Read and create data request (START) *** //
async function getRequestList(fetchProfile) {

    const webIdDoc = await fetchDocument(fetchProfile);
    const profile = webIdDoc.getSubject(fetchProfile);

    /* 1. Check if a Document tracking our notes already exists. */
    const publicTypeIndexRef = profile.getRef(solid.publicTypeIndex);
    const publicTypeIndex = await fetchDocument(publicTypeIndexRef);
    // const requestListEntryList = publicTypeIndex.findSubjects(solid.forClass, "http://schema.org/AskAction");//schema.TextDigitalDocument
    const requestListEntryList = publicTypeIndex.findSubjects(solid.forClass, requestPersonalDataHandlingGlobal)

    if (requestListEntryList.length > 0) {
        for (let i = 0; i < requestListEntryList.length; i++) {
            const requestListRef = requestListEntryList[i].getRef(solid.instance);
            if (requestListRef) {
                if (requestListRef.toString() === fetchProfile.slice(0, fetchProfile.length - 15) + 'public/request.ttl') {
                    return await fetchDocument(requestListRef);
                }
            }
        }
    }/* 2. If it doesn't exist, create it. */
    return initialiseRequestList(profile, publicTypeIndex).then(() => {
        alert("New file 'public/request.ttl'is created!")
    });
}

async function initialiseRequestList(profile, typeIndex) {
    // Get the root URL of the user's Pod:
    const storage = profile.getRef(space.storage);

    // Decide at what URL within the user's Pod the new Document should be stored:
    const requestListRef = storage + 'public/request.ttl';

    // Create the new Document:
    const requestList = createDocument(requestListRef);
    await requestList.save();

    // Store a reference to that Document in the public Type Index for `schema:dataFeedElement`:
    const typeRegistration = typeIndex.addSubject();
    typeRegistration.addRef(rdf.type, solid.TypeRegistration)
    typeRegistration.addRef(solid.instance, requestList.asRef())
    // typeRegistration.addRef(solid.forClass, "http://schema.org/AskAction")
    typeRegistration.addRef(solid.forClass, requestPersonalDataHandlingGlobal)
    await typeIndex.save([typeRegistration]);

    // And finally, return our newly created (currently empty) notes Document:
    const firstRequestMessage = document.getElementById("firstRequestMessage");
    firstRequestMessage.textContent = "New file 'public/request.ttl' is created and initialized in your Solid Pod. -> " + storage + 'public/request.ttl';
    return requestList;
}


// Add request to the file 
async function addRequest(fetchProfile, content, requestList) {

    // User read his signing key from his pod
    const userRegisterKeyRef = "https://" + fetchProfile.substring(fetchProfile.lastIndexOf("https://") + 8, fetchProfile.lastIndexOf("/profile/card#me")) + "/private/registration.ttl";
    const userRegisterKeyDoc = await fetchDocument(userRegisterKeyRef);
    const userRegisterKeyTriples = userRegisterKeyDoc.getTriples();
    let privateKey = "";
    for (let i = 0; i < userRegisterKeyTriples.length; i++) {
        if (userRegisterKeyTriples[i].predicate.id == "http://schema.org/hasCredential") {
            privateKey = decodeBase64(userRegisterKeyTriples[i].object.value);
        }
    }

    if (privateKey.length == 0) {
        alert("Cannot find valid credential. Please register first!")
    } else {

        // Initialise the new Subject:
        var newDataElement = requestList.addSubject();
        // Indicate that the Subject is a schema:dataFeedElement:
        newDataElement.addRef(rdf.type, "http://schema.org/AskAction");
        newDataElement.addRef(rdf.type, requestPersonalDataHandlingGlobal);
        // Set the Subject's `schema:text` to the actual note contents:
        // Store the date the note was created (i.e. now):

        // Use the schema as you want 
        newDataElement.addRef(schema.creator, fetchProfile);
        newDataElement.addRef(requestDataControllerGlobal, fetchProfile);

        if (content.title) { newDataElement.addString(requestTitleLabelGlobal, content.title); }

        if (content.purposeClass) {
            for (let i = 0; i < content.purposeClass.length; i++) {
                newDataElement.addRef(requestPurposeClassGlobal, content.purposeClass[i]);
            }
        }
        if (content.purpose) { newDataElement.addString(requestPurposeLabelGlobal, content.purpose); }

        if (content.personalDataCategory) {
            for (let i = 0; i < content.personalDataCategory.length; i++) {
                newDataElement.addRef(requestDataCategoryGlobal, content.personalDataCategory[i]);
            }
        }

        // if (content.ontology) {
        //   for (let i=0; i<content.ontology.length; i++){
        //     newDataElement.addRef(requestOntologyGlobal, content.ontology[i]);
        //   } 
        // }
        if (content.data) {
            for (let i = 0; i < content.data.length; i++) {
                newDataElement.addRef(requestDataElementGlobal, content.data[i]);
            }
        }
        if (content.period) { newDataElement.addDateTime(requestExpiryGlobal, content.period); }
        if (content.numInstance) { newDataElement.addInteger(requestCollectionSizeGlobal, parseInt(content.numInstance)); }

        if (content.dataProcessingCategory) {
            for (let i = 0; i < content.dataProcessingCategory.length; i++) {
                newDataElement.addRef(requestDataProcessGlobal, content.dataProcessingCategory[i]);
            }
        }

        if (content.model) { newDataElement.addString(requestAnalysisLogicGlobal, content.model); }
        if (content.consequence) { newDataElement.addString(requestConsequenceGlobal, content.consequence); }
        // if (content.recipient) {newDataElement.addString(requestRecipientGlobal, content.recipient);}

        const createdDate = new Date(Date.now())
        newDataElement.addDateTime(schema.dateCreated, createdDate);

        await requestList.save([newDataElement]);

        // add request to register list 
        const fetchRegisterLinkFile = await fetchDocument(registerFileURL)

        const newRegisterRecord = fetchRegisterLinkFile.addSubject();
        newRegisterRecord.addRef(schema.recordedAs, newDataElement.asRef());
        newRegisterRecord.addRef(schema.creator, fetchProfile);

        const requestContent = saveRequestLocally(newDataElement, content, fetchProfile, createdDate);
        const signature = sign.detached(decodeUTF8(requestContent), privateKey);
        newRegisterRecord.addString(schema.validIn, encodeBase64(signature));

        await fetchRegisterLinkFile.save([newRegisterRecord])
        return "Thank you for posting a new data request! You can find the RDF file of the request in the public/request.ttl in your SOLID pod";
    };
}
// *** Read and create data request (END) *** //

// ARRANGE
// *** Customize time format (START) *** //
function formatTime(dateTime) {
    var dd = String(dateTime.getDate()).padStart(2, '0');
    var mm = String(dateTime.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = dateTime.getFullYear();
    var hr = String(dateTime.getHours() + (dateTime.getTimezoneOffset()) / 60).padStart(2, '0');
    var min = String(dateTime.getMinutes()).padStart(2, '0');
    var sec = String(dateTime.getSeconds()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd + 'T' + hr + ':' + min + ':' + sec + 'Z'
}
// *** Customize time format (END) *** //

// *** Save data request locally for signing the request (START) *** //
function saveRequestLocally(newDataElement, content, fetchProfile, createdDate) {

    const subject = newDataElement.asRef(); // `<${}> <${}> <${}>.\n`
    let requestTripleString = `<${subject}> <${rdf.type}> <http://schema.org/AskAction>.`;
    requestTripleString += `<${subject}> <${rdf.type}> ${requestPersonalDataHandlingGlobal}.`;
    // requestTripleString += `<${subject}> ${requestRecipientGlobal} ${content.recipient}.`;
    requestTripleString += `<${subject}> ${requestAnalysisLogicGlobal} ${content.model}.`;
    requestTripleString += `<${subject}> ${requestCollectionSizeGlobal} ${content.numInstance}.`;
    requestTripleString += `<${subject}> <${schema.creator}> <${fetchProfile}>.`;
    requestTripleString += `<${subject}> <${requestDataControllerGlobal}> <${fetchProfile}>.`;
    // requestTripleString += `<${subject}> <${schema.dateCreated}> ${formatTime(createdDate)}.`; //${createdDate.toString().split(" (")[0]}
    // requestTripleString += `<${subject}> <${schema.endDate}> ${formatTime(content.period)}.`;//${content.period.toString().split(" (")[0]}
    requestTripleString += `<${subject}> <http://schema.org/purpose> ${content.purpose}.`;
    requestTripleString += `<${subject}> <http://schema.org/title> ${content.title}.`;

    if (content.data) {
        let sort_content_data = content.data.sort()
        for (let i = 0; i < content.data.length; i++) {
            requestTripleString += `<${subject}> <${requestDataElementGlobal}> <${sort_content_data[i]}>.`;
        }
    }
    if (content.purposeClass) {
        let sort_purposeClass = content.purposeClass.sort()
        for (let i = 0; i < content.purposeClass.length; i++) {
            requestTripleString += `<${subject}> <${requestPurposeClassGlobal}> <${sort_purposeClass[i]}>.`;
        }
    }
    if (content.personalDataCategory) {
        let sort_personalDataCategory = content.personalDataCategory.sort()
        for (let i = 0; i < content.personalDataCategory.length; i++) {
            requestTripleString += `<${subject}> <${requestDataCategoryGlobal}> <${sort_personalDataCategory[i]}>.`;
        }
    }
    if (content.dataProcessingCategory) {
        let sort_dataProcessingCategory = content.dataProcessingCategory.sort()
        for (let i = 0; i < content.dataProcessingCategory.length; i++) {
            requestTripleString += `<${subject}> <${requestDataProcessGlobal}> <${sort_dataProcessingCategory[i]}>.`;
        }
    }
    // console.log(requestTripleString)
    return requestTripleString
}
// *** Save data request locally for signing the request (END) *** //

// *** Fetch document function (START) ***//
async function fetchRequestURL(fetchRequest) {
    return await fetchDocument(fetchRequest)
}
// *** Fetch document function (END) ***//

// *** Create a participation record (START) ***//
async function getParticipateList(fetchProfile) {

    const webIdDoc = await fetchDocument(fetchProfile);
    const profile = webIdDoc.getSubject(fetchProfile);

    /* 1. Check if a Document tracking our notes already exists. */
    const privateTypeIndexRef = profile.getRef(solid.privateTypeIndex);
    const privateTypeIndex = await fetchDocument(privateTypeIndexRef);
    // const participateListEntryList = privateTypeIndex.findSubjects(solid.forClass, joinActionGlobal);//schema.TextDigitalDocument
    const participateListEntryList = privateTypeIndex.findSubjects(solid.forClass, joinConsentGlobal)

    /* 2. If it doesn't exist, create it. */
    if (participateListEntryList.length == 0) {
        initialiseParticipateList(profile, privateTypeIndex).then(participateList => {
            alert("As this is your first time to participate in a data request, we have created 'private/participation.ttl'is for you! Please approve the request again. ");
            return participateList;
        });
    }
    else {
        // 3. If it exists, fetch the participation.ttl data
        for (let i = 0; i < participateListEntryList.length; i++) {
            const participateListRef = participateListEntryList[i].getRef(solid.instance);
            if (participateListRef) {
                if (participateListRef.toString() === fetchProfile.slice(0, fetchProfile.length - 15) + 'private/participation.ttl') {
                    return await fetchDocument(participateListRef);
                }
            }
        }
    }
}

async function initialiseParticipateList(profile, typeIndex) {
    // Get the root URL of the user's Pod:
    const storage = profile.getRef(space.storage);

    // Decide at what URL within the user's Pod the new Document should be stored:
    const participateListRef = storage + 'private/participation.ttl';

    // Create the new Document:
    const participateList = createDocument(participateListRef);
    await participateList.save();

    // Store a reference to that Document in the public Type Index for `schema:dataFeedElement`:
    const typeRegistration = typeIndex.addSubject();
    typeRegistration.addRef(rdf.type, solid.TypeRegistration)
    typeRegistration.addRef(solid.instance, participateList.asRef())
    typeRegistration.addRef(solid.forClass, joinActionGlobal)
    typeRegistration.addRef(solid.forClass, joinConsentGlobal)
    await typeIndex.save([typeRegistration]);

    // And finally, return our newly created (currently empty) notes Document:
    return participateList;
}


// Add participation record to the file 
async function addParticipation(fetchProfile, requestList, participateRequestId, participateList, AccessControlList, collectionSize, endDate, participate_period, data_recipient, privacyOption) {
    // get the number of responses (participants)
    const responseSize = requestList.findSubjects(rdf.type, joinConsentGlobal).length;
    // the current date
    const responseDate = new Date(Date.now());
    // get the webIDs of participants
    const responseUser = participateList.findSubjects(joinDataSubjectGlobal, fetchProfile);
    let responseUserExisted = false;

    // check if the participant already responded to the data request
    for (let i = 0; i < responseUser.length; i++) {
        if (responseUser[i].getRef(joinConsentNoticeGlobal) == participateRequestId) {
            responseUserExisted = true;
        }
    }
    
    if (responseSize <= collectionSize) {
        if (responseDate <= endDate) {
            if (!responseUserExisted) {
                if (participate_period >= new Date(Date.now())) {
                    if (!privacyOption) {
    //                    // User read his signing key from his pod
                        const userRegisterKeyRef = "https://" + fetchProfile.substring(fetchProfile.lastIndexOf("https://") + 8, fetchProfile.lastIndexOf("/profile/card#me")) + "/private/registration.ttl";
                        const userRegisterKeyDoc = await fetchDocument(userRegisterKeyRef);
                        const userRegisterKeyTriples = userRegisterKeyDoc.getTriples();
                        let privateKey = "";
                        
                        for (let i = 0; i < userRegisterKeyTriples.length; i++) {
                            if (userRegisterKeyTriples[i].predicate.id == "http://schema.org/hasCredential") {
                                privateKey = decodeBase64(userRegisterKeyTriples[i].object.value);
                            }
                        }
                        if (privateKey.length == 0) {
                            alert("Cannot find valid credential. Please register first!")
                        } else {
                            let expiry_single = "https://schema.org/False"
                            if (new Date(Date.now()) > endDate) {
                                let expiry_single = "https://schema.org/True"
                            }
    ////                        // add participate record to participation.ttl
                            const newParticipateDataElement = participateList.addSubject();
                            newParticipateDataElement.addRef(rdf.type, joinActionGlobal);
                            newParticipateDataElement.addRef(rdf.type, joinConsentGlobal);

                            newParticipateDataElement.addRef(joinDataSubjectGlobal, fetchProfile);
                            newParticipateDataElement.addRef(joinConsentNoticeGlobal, participateRequestId);
                            newParticipateDataElement.addDateTime(joinDataCreatedGlobal, new Date(Date.now()));
                            newParticipateDataElement.addDateTime(joinhasProvisionTimeGlobal, new Date(Date.now()));
                            //newParticipateDataElement.addRef(joinhasProvisionMethodGlobal, "https://sunchang0124.github.io/dist/participate.html");
                            newParticipateDataElement.addDateTime(joinhasWithdrawalTimeGlobal, participate_period);
                            newParticipateDataElement.addRef(joinDataRecipientGlobal, data_recipient);
                            newParticipateDataElement.addRef(joinhasExpiryGlobal, expiry_single);
                            newParticipateDataElement.addDateTime(joinhasExpiryTimeGlobal, endDate);


    //                        // add participate record to Pod Server's request-response file 
                            const registerRequestResponseFileURL = registerParticipationFolder + participateRequestId.split('#')[1] + ".ttl";

    //                        /* 1. Check if a participation register list already exists. */
                            const registerIndex = await fetchDocument(registerIndexRef);
                            const registerIndexEntryList = registerIndex.getSubject(registerRequestResponseFileURL).getRef(rdf.type);
                            

                            //Disabled because cauzing errors
                            /* 2. If it doesn't exist, create it. */
                            if (!registerIndexEntryList) {

                                // Create the new Document
                                //solid.data[registerRequestResponseFileURL].put()
              
                                await createDocument(registerRequestResponseFileURL).save();

                        
                                // Add record in the registerIndex.ttL
                                // solid.add doesn't work, have to do it manually.
                                //await solid.data[registerIndexRef + '#' + participateRequestId.split('#')[1]]["http://schema.org/RegisterAction"].add(namedNode(registerRequestResponseFileURL));
                            }

    //                        // 3. If it exists, add participation record in registerParticipation.ttl
                            console.log(registerIndexEntryList)
                            const registerIndexEntryInput = registerIndex.addSubject();
                            registerIndexEntryInput.addRef(rdf.type, joinActionGlobal);
                            registerIndexEntryInput.addRef(rdf.type, joinConsentGlobal);

                            registerIndexEntryInput.addRef(joinDataSubjectGlobal, fetchProfile);
                            registerIndexEntryInput.addRef(joinConsentNoticeGlobal, participateRequestId);
                            registerIndexEntryInput.addDateTime(joinDataCreatedGlobal, new Date(Date.now()));
                            registerIndexEntryInput.addDateTime(joinhasProvisionTimeGlobal, new Date(Date.now()));
                            registerIndexEntryInput.addDateTime(joinhasWithdrawalTimeGlobal, participate_period);
                            registerIndexEntryInput.addRef(joinDataRecipientGlobal, data_recipient);
                            registerIndexEntryInput.addRef(joinhasExpiryGlobal, expiry_single);
                            registerIndexEntryInput.addDateTime(joinhasExpiryTimeGlobal, endDate);

                            const signature = sign.detached(decodeUTF8(participateRequestId.split('#')[1]), privateKey);

                            //const addedData = await solid.data[registerRequestResponseFileURL + '#' + addSubjectID][schema.validIn].add(literal(encodeBase64(signature)));

                            await participateList.save([newParticipateDataElement]);

    //                        // add viewer access to the requester automatically (Users have to give control access to the application)
                            const newRequestAccessControl = AccessControlList.addSubject("Read");
                            const responserWebId = requestList.getSubject(participateRequestId).getRef(schema.creator);

                            newRequestAccessControl.addRef(rdf.type, acl.Authorization);
                            newRequestAccessControl.addRef(acl.accessTo, dataFileName);
                            newRequestAccessControl.addRef(acl.agent, podServerURL); // Give Pod Server/Provider access to read data (responserWebId)
                            newRequestAccessControl.addRef(acl.mode, acl.Read);
                            newRequestAccessControl.addDateTime(schema.endDate, participate_period);

                            await AccessControlList.save([newRequestAccessControl]);
                        }
                    }
                    return true;

                } else { alert("Participation end date has to be later than today.") };
            } else { alert("You are in the participates list already.") };
        } else { alert("Sorry, request end date has expired.") };
    } else { alert("Sorry, request has enough participants.") };
}
// *** Create a participation record (END) ***//

async function getRecommender(input) {

    let response = await fetch("https://data.bioontology.org/recommender?input=" + input + "&apikey=21646475-b5a0-4e92-8aba-d9fcfcfea388");
    let data = await response.json();
    let item = [];

    for (let i = 0; i < 5; i++) {
        item.push({ Text: data[i]['ontologies'][0]['acronym'], FoundURI: data[i]['ontologies'][0]['@id'], Score: data[i]['evaluationScore'] })
    }
    return item;
}


function getDataLabels(input) {
    let code_dict = {
        14089001: " - Aantal rode bloedcellen",
        184099003: " - Geboortedatum",
        224209007: " - Woon- en verblijfssituatie",
        266995000: " - Geschiedenis van cardiovasculaire ziekte",
        271649006: " - Systolische bloeddruk",
        414798009: " - N-terminaal pro-B-type natriuretisch peptide",
        439401001: " - Diagnose",
        67079006: " - Glucose waarde",
        75672003: " - Bepaling van het gemiddelde bloedplaatjesvolume",

        398192003: " - Bijkomende aandoeningen",
        182833002: " - Medication given",
        401207004: " - Aanwezige bijwerkingen van medicatie",
        92818009: " - Chronische myeloïde leukemie",

        22232009: " - Ziekenhuis",
        263495000: " - Geslacht",

        D007182: " - Inkomen",
        D007341: " - Verzekeringsinformatie",
        118598001: " - Eigendomsinformatie",
        224164009: " - Financiële omstandigheden",

        252150008: " - Lipide elementen",
        38082009: " - Hemoglobine",
        56564003: " - BCR-ABL proteïne",
        6684200: " - Red cell distribution width",


        14679004: " - Beroep",
        397669002: " - Leeftijd",
        409073007: " - Opleidingsniveau",
        703503000: " - Naam"

    }

    let code_dict_en = {
        14089001: " - Red blood cell count",
        184099003: " - Date of birth",
        224209007: " - Residence and accommodation circumstances",
        266995000: " - History of cardiovascular disease",
        271649006: " - Systolic blood pressure",
        414798009: " - N-terminal pro-B-type natriuretic peptide",
        439401001: " - Diagnosis",
        67079006: " - Glucose",
        75672003: " - Platelet mean volume determination",

        398192003: " - Co-morbid conditions",
        182833002: " - Medication given",
        401207004: " - Medication side effects present",
        92818009: " - Chronic myeloid leukemia",

        22232009: " - Hospital",
        263495000: " - Gender",

        D007182: " - Income",
        D007341: " - Insurance",
        118598001: " - Property",
        224164009: " -  Financial circumstances",

        252150008: " - Lipid elements",
        38082009: " - Hemoglobin",
        56564003: " - Protein BCR-ABL",
        6684200: " - Red cell distribution width",


        14679004: " - Occupation",
        397669002: " - Age",
        409073007: " - Education",
        703503000: " - Name"

    }
    let item = code_dict[input]
    return item

    // try {
    //     let response = await fetch("https://data.bioontology.org/search?q=" + input + "&apikey=21646475-b5a0-4e92-8aba-d9fcfcfea388");
    //     let data = await response.json();
    //     let item = data['collection'][0]['prefLabel']
    //     return item;
    // } catch (error) {
    //     console.log(error)
    // }
}



// *** Write and generate requests to cards (START) ***//
function writeAllRequest(profile, requestTriples, fetchRequest) {
    let requestContent = Object();
    let dataElementList = []
    let purposeClassList = []
    let personalDataCategoryList = []
    let dataProcessingCategoryList = []
    // let ontologyList = []

    for (let i = 0; i < requestTriples.length; i++) {
        //if (requestTriples[i].object.value >= new Date(Date.now())) {
   
            if (requestTriples[i].subject.id === fetchRequest) {
                requestContent.webid = profile.asRef();
                requestContent.name = profile.getString(foaf.name);
                requestContent.organization = profile.getString("http://www.w3.org/2006/vcard/ns#organization-name");
                requestContent.image = profile.getRef(vcard.hasPhoto);

                requestContent.url = fetchRequest;
                if (requestTriples[i].predicate.id === requestPurposeClassGlobal) {
                    purposeClassList.push(requestTriples[i].object.value);
                }
                // requestContent.purposeClass = "Class of purpose: "+ requestTriples[i].object.value;}
                if (requestTriples[i].predicate.id === requestTitleLabelGlobal) {
                    requestContent.title = requestTriples[i].object.value;
                }
                if (requestTriples[i].predicate.id === requestPurposeLabelGlobal) {
                    requestContent.purpose = requestTriples[i].object.value;
                }
                if (requestTriples[i].predicate.id === requestDataCategoryGlobal) {
                    personalDataCategoryList.push(requestTriples[i].object.value);
                }
                if (requestTriples[i].predicate.id === requestDataProcessGlobal) {
                    dataProcessingCategoryList.push(requestTriples[i].object.value);
                }
                // if (requestTriples[i].predicate.id === requestOntologyGlobal){
                //   ontologyList.push(requestTriples[i].object.value);}
                if (requestTriples[i].predicate.id === requestExpiryGlobal) {
                    requestContent.period = requestTriples[i].object.value;
                }
                // requestContent.period = "End date: " + "2025-01-01"}
                if (requestTriples[i].predicate.id === requestAnalysisLogicGlobal) {
                    requestContent.analysis = requestTriples[i].object.value;
                }
                if (requestTriples[i].predicate.id === requestCollectionSizeGlobal) {
                    requestContent.numInstance = requestTriples[i].object.value;
                }
                // if (requestTriples[i].predicate.id === requestRecipientGlobal){
                //   requestContent.recipient = "Data Recipient: " + requestTriples[i].object.value;}
                if (requestTriples[i].predicate.id === requestConsequenceGlobal) {
                    requestContent.consequence = requestTriples[i].object.value;
                }
                if (requestTriples[i].predicate.id === requestDataElementGlobal) {
                    dataElementList.push(requestTriples[i].object.value);
                } //add jan janssen participation 
                if (requestTriples[i].predicate.id === requestParticipation) {
                    requestContent.participation = requestTriples[i].object.value;
                }
            }
            requestContent.purposeClass = "Purpose: " + purposeClassList;
            requestContent.personalDataCategory = "Personal data categories: " + personalDataCategoryList;
            requestContent.dataProcessingCategory = "Data processing categories: " + dataProcessingCategoryList;
            // requestContent.ontology = ontologyList;
            requestContent.dataElement = "Requested data: " + dataElementList;
        //}
    }
    if (Object.keys(requestContent).length < 2) {
        requestContent = false;
    }
    return requestContent
}

/**************************
 * Generate request cards *
 **************************/
async function generateCards(requestContentList, userRole, session, participant_basket) {

    var cleanContainer = document.getElementById("OpenContainer");
    cleanContainer.innerHTML = "<h2>Openstaande verzoeken<\h2>"; //"<h2>Open requests<\h2>";

    var ApprovedContainer = document.getElementById("ApprovedContainer");
    ApprovedContainer.innerHTML = "<h2>Geaccepteerde verzoeken<\h2>"; //"<h2>Approved requests<\h2>";

    var declinedContainer = document.getElementById("DeclinedContainer");
    declinedContainer.innerHTML = "<h2>Afgewezen verzoeken<\h2>"; //"<h2>Declined requests<\h2>";

    const div_open_cardsContainer = document.createElement("div");
    div_open_cardsContainer.className = "ui fluid fixed cards";
    div_open_cardsContainer.id = "open_cardsContainer";
    document.getElementById('OpenContainer').appendChild(div_open_cardsContainer);

    const div_approved_cardsContainer = document.createElement("div");
    div_approved_cardsContainer.className = "ui fluid fixed cards";
    div_approved_cardsContainer.id = "approved_cardsContainer";
    document.getElementById('ApprovedContainer').appendChild(div_approved_cardsContainer);

    const div_declined_cardsContainer = document.createElement("div");
    div_declined_cardsContainer.className = "ui fluid fixed cards";
    div_declined_cardsContainer.id = "declined_cardsContainer";
    document.getElementById('DeclinedContainer').appendChild(div_declined_cardsContainer);
    

    let purpose_label = {
        CommercieelOnderzoek: "orange", 
        OnderzoekEnOntwikkeling: "blue",
        // Security: "green",
        RegistratieAuthenticatie: "yellow",
        GepersonaliseerdeAanbevelingenMaken: "teal",
        // ServiceProvision: "red",
        // LegalObligation: "purple"
    }

    let purpose_label_en = {
        CommercialResearch: "orange", 
        ResearchAndDevelopment: "blue",
        Security: "green",
        RegistrationAuthentication: "yellow",
        CreatePersonalizedRecommendations: "teal",
        ServiceProvision: "red",
        LegalObligation: "purple"
    }

    let open_count = false;
    let approved_count = false;
    let declined_count = false;

    for (var i = 0; i < requestContentList.length; i++) {


        // Generate request cards
        const div_card = document.createElement("div");
        div_card.className = "ui fluid raised card";
        div_card.id = "cardID" + i.toString();
        if (requestContentList[i].participation == "http://www.w3.org/ns/dpv#open"){
            document.getElementById('open_cardsContainer').appendChild(div_card);
            open_count = true;

        }else if(requestContentList[i].participation == "http://www.w3.org/ns/dpv#consented"){
            document.getElementById('approved_cardsContainer').appendChild(div_card);
            approved_count = true;

        }else if(requestContentList[i].participation == "http://www.w3.org/ns/dpv#declined"){
            document.getElementById('declined_cardsContainer').appendChild(div_card);
            declined_count = true;
        }


        const div_label = document.createElement("div");
        let purpose_label_content = requestContentList[i].purposeClass.split(",")[0].toString().split(": ")[1].split("#")[1];
        div_label.className = "ui " + purpose_label[purpose_label_content] + " ribbon label";
        div_label.id = "labelID" + i.toString();
        let text_1 = purpose_label_content.toString().replace(/([A-Z][a-z])/g, ' $1').trim();
        div_label.textContent = text_1.charAt(0) + text_1.substring(1).toLowerCase();
        
        document.getElementById('cardID' + i.toString()).appendChild(div_label);

        const div_content = document.createElement("div");
        //div_content.href = requestContentList[i].url;
        div_content.className = "content";
        div_content.id = "contentID" + i.toString();
        document.getElementById('cardID' + i.toString()).appendChild(div_content);

        const div_img = document.createElement("img");
        div_img.className = "right floated mini ui image";
        div_img.src = requestContentList[i].image; //requestContentList[i].image; //
        div_img.id = "imgID" + i.toString();
        document.getElementById('contentID' + i.toString()).appendChild(div_img);

        const div_header = document.createElement("div");
        div_header.className = "header";
        div_header.id = "headerID" + i.toString();
        div_header.textContent = requestContentList[i].title //"Title of research"
        // div_header.href = requestContentList[i].url
        document.getElementById('contentID' + i.toString()).appendChild(div_header);

        const div_meta = document.createElement("div");
        div_meta.className = "description";
        div_meta.id = "metaID" + i.toString();
        div_meta.textContent = "Op verzoek van " + requestContentList[i].name + " van " + requestContentList[i].organization; //"IDS";
        // div_meta.href = requestContentList[i].url.toString().split("/public/")[0] + "/profile/card#me"
        document.getElementById('contentID' + i.toString()).appendChild(div_meta);

        const div_description = document.createElement("div");
        div_description.className = "description";
        div_description.id = "descriptionID" + i.toString();
        div_description.textContent = "Beschrijving van het onderzoek:  " + requestContentList[i].purpose; //"Purpose description";
        document.getElementById('contentID' + i.toString()).appendChild(div_description);


        const div_extraContent = document.createElement("div");
        div_extraContent.className = "extra content";
        div_extraContent.id = "extraContent" + i.toString();
        document.getElementById("cardID" + i.toString()).appendChild(div_extraContent);
        
        const div_readMoreButton = document.createElement("div");
        div_readMoreButton.className = "ui buttom attached readMore button index_" + i.toString();
        div_readMoreButton.textContent = "Lees verder"; //"Read more";
        div_readMoreButton.id = "readMoreButton" + i.toString();
        document.getElementById('extraContent' + i.toString()).appendChild(div_readMoreButton);


        const div_request_modal = document.createElement("div");
        div_request_modal.className = "ui modal request index_" + i.toString();
        div_request_modal.id = "request_modalID" + i.toString();
        document.getElementById("modal_component").appendChild(div_request_modal);

        const div_windowHeader = document.createElement("div");
        div_windowHeader.className = "header";
        div_windowHeader.textContent = requestContentList[i].title;
        document.getElementById("request_modalID" + i.toString()).appendChild(div_windowHeader);

        const div_windowContent = document.createElement("div");
        div_windowContent.className = "request content";
        div_windowContent.id = "request_contentID" + i.toString();
        document.getElementById("request_modalID" + i.toString()).appendChild(div_windowContent);

        const div_extraWindowContent = document.createElement("div");
        div_extraWindowContent.className = "extra window content";
        div_extraWindowContent.id = "extra_windowContent" + i.toString();
        document.getElementById("request_contentID" + i.toString()).appendChild(div_extraWindowContent);


        let addHeader_purpose = document.createElement("h5");
        addHeader_purpose.className = "header"
        addHeader_purpose.textContent =  "Doel van gegevensaanvraag:"; //"Purpose of data request:";
        document.getElementById("extra_windowContent" + i.toString()).appendChild(addHeader_purpose);

        const div_classPurpose = document.createElement("div");
        div_classPurpose.className = "description";
        div_classPurpose.id = "classPurposeID" + i.toString();
        const listofpurpose = requestContentList[i].purposeClass.split(",")
        let text_2 = listofpurpose[0].toString().split(": ")[1].split("#")[1].replace(/([A-Z][a-z])/g, ' $1').trim();
        div_classPurpose.textContent =  text_2.charAt(0) + text_2.substring(1).toLowerCase();//equestContentList[i].purposeClass; //"Purpose Class";
        document.getElementById('extra_windowContent' + i.toString()).appendChild(div_classPurpose);

      

        let addHeader_description = document.createElement("h5");
        addHeader_description.className = "header"
        addHeader_description.textContent =  "Beschrijving van het onderzoek: "; //"Study description:";
        document.getElementById("extra_windowContent" + i.toString()).appendChild(addHeader_description);

        const div_windowDescription = document.createElement("div");
        div_windowDescription.className = "description";
        div_windowDescription.id = "descriptionID" + i.toString();
        div_windowDescription.textContent = requestContentList[i].purpose; //"Purpose description";
        document.getElementById('extra_windowContent' + i.toString()).appendChild(div_windowDescription);


        let addHeader_category = document.createElement("h5");
        addHeader_category.className = "header"
        addHeader_category.textContent =  "Persoonlijke gegevenscategorie"; //"Personal Data Category: "; 
        document.getElementById("extra_windowContent" + i.toString()).appendChild(addHeader_category);

        // const div_personalDataCategory = document.createElement("div");
        // div_personalDataCategory.className = "description";
        // div_personalDataCategory.id = "div_personalDataCategoryID" + i.toString();
        // div_personalDataCategory.textContent = //requestContentList[i].personalDataCategory; //"Personal Data Category";
        // document.getElementById('extra_windowContent' + i.toString()).appendChild(div_personalDataCategory);



        const listofpersonalDataCategory = requestContentList[i].personalDataCategory.split(",");
        let href_personalDataCategory = document.createElement("div");
        let text_3 = listofpersonalDataCategory[0].toString().split(": ")[1].split("#")[1].replace(/([A-Z][a-z])/g, ' $1').trim();

        let link_personalDataCategory = document.createTextNode(" - "+text_3.charAt(0) + text_3.substring(1).toLowerCase());
        href_personalDataCategory.appendChild(link_personalDataCategory);
        document.getElementById('extra_windowContent' + i.toString()).appendChild(href_personalDataCategory);


        for (let itr = 1; itr < 3; itr++) {
            if (itr < listofpersonalDataCategory.length) {
                document.getElementById('extra_windowContent' + i.toString()).appendChild(document.createElement("div"));
                let href_personalDataCategory_1 = document.createElement("div");
                
                let text_4 = listofpersonalDataCategory[itr].toString().split("#")[1].replace(/([A-Z][a-z])/g, ' $1').trim();
                let link_personalDataCategory = document.createTextNode(" - "+text_4.charAt(0) + text_4.substring(1).toLowerCase());
                href_personalDataCategory_1.appendChild(link_personalDataCategory);
                // href_personalDataCategory_1.textContent = listofpersonalDataCategory[itr].replace(/([A-Z][a-z])/g, ' $1').trim();
                document.getElementById('extra_windowContent' + i.toString()).appendChild(href_personalDataCategory_1);
            }
            if (listofpersonalDataCategory.length > 3 && itr == 2) {
                const div_endDataCategory = document.createElement("div");
                div_endDataCategory.textContent = "... ... " + (listofpersonalDataCategory.length - 3).toString() + " more personal data categories";
                document.getElementById('extra_windowContent' + i.toString()).appendChild(div_endDataCategory);
            }
        }

        let addHeader_dataProcessingCategory = document.createElement("h5");
        addHeader_dataProcessingCategory.className = "header"
        addHeader_dataProcessingCategory.textContent =  "Gegevensverwerking categorie: "; //"Data Processing Category: ";
        document.getElementById("extra_windowContent" + i.toString()).appendChild(addHeader_dataProcessingCategory);

        // const div_dataProcessingCategory = document.createElement("div");
        // div_dataProcessingCategory.className = "description";
        // div_dataProcessingCategory.id = "div_dataProcessingCategoryID" + i.toString();
        // div_dataProcessingCategory.textContent = "Data Processing Category: "; //requestContentList[i].dataProcessingCategory; //"Data Processing Category";
        // document.getElementById('extra_windowContent' + i.toString()).appendChild(div_dataProcessingCategory);


        const listofdataProcessingCategory = requestContentList[i].dataProcessingCategory.split(",");
        let href_dataProcessingCategory = document.createElement("div");


        let text_6 = listofdataProcessingCategory[0].toString().split(": ")[1].split("#")[1].replace(/([A-Z][a-z])/g, ' $1').trim();
        let link_dataProcessingCategory = document.createTextNode(" - "+text_6.charAt(0) + text_6.substring(1).toLowerCase());
        href_dataProcessingCategory.appendChild(link_dataProcessingCategory);
        // href_dataProcessingCategory.textContent = listofdataProcessingCategory[0].toString().split(": ")[1].replace(/([A-Z][a-z])/g, ' $1').trim();
        document.getElementById('extra_windowContent' + i.toString()).appendChild(href_dataProcessingCategory);


        for (let itr = 1; itr < 3; itr++) {
            if (itr < listofdataProcessingCategory.length) {
                document.getElementById('extra_windowContent' + i.toString()).appendChild(document.createElement("div"));
                let href_dataProcessingCategory_1 = document.createElement("div");

                let text_8 = listofdataProcessingCategory[itr].toString().split("#")[1].replace(/([A-Z][a-z])/g, ' $1').trim();

                let link_dataProcessingCategory = document.createTextNode(" - "+text_8.charAt(0) + text_8.substring(1).toLowerCase());
                href_dataProcessingCategory_1.appendChild(link_dataProcessingCategory);
                // href_dataProcessingCategory_1.textContent = listofdataProcessingCategory[itr].replace(/([A-Z][a-z])/g, ' $1').trim();
                document.getElementById('extra_windowContent' + i.toString()).appendChild(href_dataProcessingCategory_1);
            }
            if (listofdataProcessingCategory.length > 3 && itr == 2) {
                const div_endDataProcessing = document.createElement("div");
                div_endDataProcessing.textContent = "... ... " + (listofdataProcessingCategory.length - 3).toString() + " more elements"; //"period";
                document.getElementById('extra_windowContent' + i.toString()).appendChild(div_endDataProcessing);
            }
        }


        // Request data elements
        let addHeader_dataelement= document.createElement("h5");
        addHeader_dataelement.className = "header"
        addHeader_dataelement.textContent =  "Noodzakelijke gegevens: "; //"Requested data: "; 
        document.getElementById("extra_windowContent" + i.toString()).appendChild(addHeader_dataelement);

        // const div_dataElement = document.createElement("div");
        // div_dataElement.className = "description";
        // div_dataElement.id = "dataElementID" + i.toString();
        // div_dataElement.textContent = "Requested data: " //requestContentList[i].dataElement; //"Data Element";
        // document.getElementById('extra_windowContent' + i.toString()).appendChild(div_dataElement);

        const listofElement = requestContentList[i].dataElement.split(",");

        console.log(listofElement.length)

        if (listofElement.length <= 30) {

            for (let itr = 1; itr < listofElement.length; itr++) {
                const div_dataElement = document.getElementById('extra_windowContent' + i.toString()).appendChild(document.createElement("div"));
                let href_dataElement = document.createElement("div");
                // let displayLabel = await getDataLabels(listofElement[itr].toString().split("/").pop())
                href_dataElement.textContent = getDataLabels(listofElement[itr].toString().split("/").pop())
                document.getElementById('extra_windowContent' + i.toString()).appendChild(href_dataElement);
            }

        }
        else if (listofElement.length > 30) {
            
            for (let itr = 1; itr < listofElement.length; itr++) {
                const div_dataElement = document.getElementById('extra_windowContent' + i.toString()).appendChild(document.createElement("div"));
                let href_dataElement = document.createElement("div");

                // let displayLabel = await getDataLabels(listofElement[itr].toString().split("/").pop())
                href_dataElement.textContent = getDataLabels(listofElement[itr].toString().split("/").pop())

                document.getElementById('extra_windowContent' + i.toString()).appendChild(href_dataElement);
            }

            const div_endElement = document.createElement("div");//document.getElementById('contentID' + i.toString()).appendChild(document.createElement("div"));
            div_endElement.id = "dropdown_option" + i.toString();
            div_endElement.className = "ui floating dropdown error";
            div_endElement.textContent = "... ... " + (listofElement.length - 5).toString() + " more data elements"; //"period";
            document.getElementById('extra_windowContent' + i.toString()).appendChild(div_endElement);

            const dropdown_icon = document.createElement("i");
            dropdown_icon.className = "dropdown icon";
            document.getElementById('extra_windowContent' + i.toString()).appendChild(dropdown_icon);

            const dropdown_menu = document.getElementById('extra_windowContent' + i.toString()).appendChild(document.createElement("div"));
            dropdown_menu.className = "menu";
            dropdown_menu.id = "menu" + + i.toString();
            document.getElementById('extra_windowContent' + i.toString()).appendChild(dropdown_menu);

            for (let itr = 30; itr < listofElement.length; itr++) {
                let dropdown_option = document.getElementById('menu' + i.toString()).appendChild(document.createElement("div"));
                dropdown_option.className = "item";

                let displayLabel = getDataLabels(listofElement[itr].toString().split("/").pop())

                document.getElementById('menu' + i.toString()).appendChild(dropdown_option);

            }
        }

        $('.link.example .dropdown')
            .dropdown({
                action: 'hide'
            })
            ;
        $('.ui.dropdown')
            .dropdown()
            ;
        
        let addHeader_period= document.createElement("h5");
        addHeader_period.className = "header"
        addHeader_period.textContent =  "Uw gegevens worden bewaard en gebruikt tot: " ;//"Your data will be collected and used until: "; 
        document.getElementById("extra_windowContent" + i.toString()).appendChild(addHeader_period);

        const div_period = document.createElement("div");
        div_period.className = "description";
        div_period.id = "periodID" + i.toString();
        div_period.textContent = requestContentList[i].period.toString().split("T")[0]; //"period";
        document.getElementById('extra_windowContent' + i.toString()).appendChild(div_period);
        
        
        let addHeader_instance= document.createElement("h5");
        addHeader_instance.className = "header"
        addHeader_instance.textContent =  "Verwachte hoeveelheid deelnemers:"; //"Expected number of participants: "; 
        document.getElementById("extra_windowContent" + i.toString()).appendChild(addHeader_instance);

        const div_numInstance = document.createElement("div");
        div_numInstance.className = "description";
        div_numInstance.id = "instanceID" + i.toString();
        div_numInstance.textContent = requestContentList[i].numInstance; //"numInstance";
        document.getElementById('extra_windowContent' + i.toString()).appendChild(div_numInstance);


        let addHeader_analysis= document.createElement("h5");
        addHeader_analysis.className = "header"
        addHeader_analysis.textContent =  "Geplande analyse: "; //"Planned analysis: "; 
        document.getElementById("extra_windowContent" + i.toString()).appendChild(addHeader_analysis);

        const div_analysis = document.createElement("div");
        div_analysis.className = "description";
        div_analysis.id = "analysisID" + i.toString();
        div_analysis.textContent = requestContentList[i].analysis; //"analysis";
        document.getElementById('extra_windowContent' + i.toString()).appendChild(div_analysis);

        
        let addHeader_impact= document.createElement("h5");
        addHeader_impact.className = "header"
        addHeader_impact.textContent =  "Verwachte impact: "; //"Anticipated impact: "; 
        document.getElementById("extra_windowContent" + i.toString()).appendChild(addHeader_impact);

        const div_consequence = document.createElement("div");
        div_consequence.className = "description";
        div_consequence.id = "consequenceID" + i.toString();
        div_consequence.textContent = requestContentList[i].consequence; //"consequence";
        document.getElementById('extra_windowContent' + i.toString()).appendChild(div_consequence);

        
        const div_extra = document.createElement("div");
        div_extra.className = "extra content";
        div_extra.id = "extraID" + i.toString();
        document.getElementById('request_modalID' + i.toString()).appendChild(div_extra);

        //
        if(requestContentList[i].participation != "http://www.w3.org/ns/dpv#consented"){
            const div_untilDate_des = document.createElement("h5");
            div_untilDate_des.className = "ui green header";
            div_untilDate_des.id = "untilDate_des" + i.toString();
            div_untilDate_des.textContent = "Ik wil toestemming geven voor dit onderzoek om mijn gegevens te gebruiken tot:  "; //"I would like to give consent to this study to use my data until : "
            document.getElementById('extraID' + i.toString()).appendChild(div_untilDate_des);
    
            const div_forDate = document.createElement("div");
            div_forDate.className = "ui input";
            div_forDate.id = "forDate" + i.toString();
            document.getElementById('untilDate_des' + i.toString()).appendChild(div_forDate);

            const div_untilDate = document.createElement("input");
            div_untilDate.type = "date";
            div_untilDate.id = "untilDate" + i.toString();
            document.getElementById("forDate" + i.toString()).appendChild(div_untilDate);

            const div_checkbox_field = document.createElement("div");
            div_checkbox_field.className = "inline field"
            div_checkbox_field.id = "inline_field" + i.toString();
            document.getElementById('extraID' + i.toString()).appendChild(div_checkbox_field);

            const checkbox_label = document.createElement("h5");
            checkbox_label.className = "ui green header"
            checkbox_label.textContent = "Ik wil graag de eindresultaten van dit onderzoek ontvangen. (Indien ja, vink het vakje aan)  "; //"I would like to receive the final results of this study. (If yes, check the box) "
            checkbox_label.id = "label" + i.toString();
            document.getElementById("inline_field" + i.toString()).appendChild(checkbox_label);

            const div_field = document.createElement("div");
            div_field.className = "field"
            div_field.id = "field"+ i.toString();
            document.getElementById('inline_field' + i.toString()).appendChild(div_field);


            const div_checkbox = document.createElement("div");
            div_checkbox.className = "ui checkbox"
            div_checkbox.id = "checkbox" + i.toString();
            document.getElementById('label' + i.toString()).appendChild(div_checkbox);

            $('.ui.checkbox')
            .checkbox()
            ;

            const input_checkbox = document.createElement("input");
            input_checkbox.type = "checkbox"
            input_checkbox.id = "receiveResults" + i.toString();
            document.getElementById("checkbox" + i.toString()).appendChild(input_checkbox);
        }

        const div_actions = document.createElement("div");
        div_actions.className = "actions";
        div_actions.id = "actionsID" + i.toString();
        document.getElementById('extraID' + i.toString()).appendChild(div_actions);



        const div_buttons = document.createElement("div");
        div_buttons.className = "ui two buttons";
        div_buttons.id = "buttonsID" + i.toString();
        document.getElementById('actionsID' + i.toString()).appendChild(div_buttons);


        if (requestContentList[i].participation == "http://www.w3.org/ns/dpv#open"){
            const div_greenButton = document.createElement("button");
            div_greenButton.className = "ui green toggle approve button answer index_" + i.toString();
            div_greenButton.id = "greenButtonID" + i.toString();
            div_greenButton.textContent = "Goedkeuren"; //"Approve";
            document.getElementById('buttonsID' + i.toString()).appendChild(div_greenButton);

            const div_redButton = document.createElement("button");
            div_redButton.className = "ui red toggle deny button answer index_" + i.toString();
            div_redButton.id = "redButtonID" + i.toString();
            div_redButton.textContent = "Afwijzen"; //"Decline";
            document.getElementById('buttonsID' + i.toString()).appendChild(div_redButton);

        }else if(requestContentList[i].participation == "http://www.w3.org/ns/dpv#consented"){
            const div_greenButton = document.createElement("button");
            div_greenButton.className = "ui red toggle deny button answer index_" + i.toString();
            div_greenButton.id = "greenButtonID" + i.toString();
            div_greenButton.textContent = "Afwijzen"; //"Decline";
            document.getElementById('buttonsID' + i.toString()).appendChild(div_greenButton);

            const div_greyButton = document.createElement("button");
            div_greyButton.className = "ui toggle cancel button answer index_" + i.toString();
            div_greyButton.id = "greyButtonID" + i.toString();
            div_greyButton.textContent = "Mijn toestemming intrekken"; //"Withdraw my approval";
            document.getElementById('buttonsID' + i.toString()).appendChild(div_greyButton);

        }else if(requestContentList[i].participation == "http://www.w3.org/ns/dpv#declined"){

            const div_greenButton = document.createElement("button");
            div_greenButton.className = "ui green toggle approve button answer index_" + i.toString();
            div_greenButton.id = "greenButtonID" + i.toString();
            div_greenButton.textContent = "Goedkeuren"; //"Approve";
            document.getElementById('buttonsID' + i.toString()).appendChild(div_greenButton);

            const div_greyButton = document.createElement("button");
            div_greyButton.className = "ui toggle cancel button answer index_" + i.toString();
            div_greyButton.id = "greyButtonID" + i.toString();
            div_greyButton.textContent = "Mijn afwijzing intrekken";// "Withdraw my decline";
            document.getElementById('buttonsID' + i.toString()).appendChild(div_greyButton);
        }




        $(document)
        .ready(function () {
            let modal_para = ".ui.modal.request.index_" + i.toString();
            let button_para = ".readMore.button.index_" + i.toString();
            $(modal_para)
                .modal('attach events', button_para, 'show')
                ;
        });
    };

    if (open_count == false){
        cleanContainer.innerHTML = "<h2>U heeft geen openstaande verzoeken.<\h2>"; //"<h2>You have no open requests<\h2>";
    }else if (approved_count ==false){
        ApprovedContainer.innerHTML = "<h2>U heeft geen Geaccepteerde verzoeken<\h2>"; //"<h2>You have no approved requests<\h2>";
    }else if (declined_count == false){
        declinedContainer.innerHTML = "<h2>U heeft geen Afgewezen verzoeken<\h2>"; //"<h2>You have no declined requests<\h2>";
    }
    return requestContentList;
};
// *** Write and generate requests to cards (END) ***//

// *** Plot cards on the webpage (START) ***//
async function plotCardsOnPage(webIdDoc, profileWebID, findAllSubjects, option, userRole, session, participant_basket) {
    
    var requestContentList = [];

    if (option === "fromPageEntrance") {
        for (let i = 0; i < findAllSubjects.length; i++) {
            const eachProfile = webIdDoc[i].getSubject(profileWebID[i]);
            const singleRequest = writeAllRequest(eachProfile, findAllSubjects[i].fetchedRequestDoc.getTriples(), findAllSubjects[i].fetchedRequestID)
            if (singleRequest) { requestContentList.push(singleRequest); }
        }
    } else if (option === "fromWebID") {
        const profile = webIdDoc.getSubject(profileWebID);
        for (let i = 0; i < findAllSubjects.length; i++) {
            const singleRequest = writeAllRequest(profile, findAllSubjects[i].getTriples(), findAllSubjects[i].asRef())
            if (singleRequest) { requestContentList.push(singleRequest); }
        }
    } else {
        const profile = webIdDoc.getSubject(profileWebID);
        const singleRequest = writeAllRequest(profile, findAllSubjects, option)
        if (singleRequest) { requestContentList.push(singleRequest); }
    }

    requestContentList = await generateCards(requestContentList, userRole, session, participant_basket);

    var loader = document.getElementById("loader");
    loader.style.display = "none";

    const answer_btns = document.querySelectorAll(".answer.button");
    const outcome = [answer_btns, requestContentList]

    return outcome
}
// *** Plot cards on the webpage (END) ***//


// *** Fetch registered users (START) ***//
async function fetchRegisterList(fetchRegisterRecord) {

    const registerRecordSubjects = fetchRegisterRecord.findSubjects();

    const requestURIList = [];
    const includedRequest = [];
    const requestWebIdDocList = [];
    const requestProfileIdList = [];
    for (let i = 0; i < registerRecordSubjects.length; i++) {
        const registeredSingleRequestURL = registerRecordSubjects[i].getRef(schema.recordedAs);
        if (!includedRequest.includes(registeredSingleRequestURL)) {
            const registeredSingleRequesterWebId = registerRecordSubjects[i].getRef(schema.creator);

            try {
                const fetchEachRequest = await fetchDocument(registeredSingleRequestURL);
                requestURIList.push({ fetchedRequestID: registeredSingleRequestURL, fetchedRequestDoc: fetchEachRequest });

                requestProfileIdList.push(registeredSingleRequesterWebId);
                const webIdDoc = await fetchDocument(registeredSingleRequesterWebId);
                requestWebIdDocList.push(webIdDoc);

                includedRequest.push(registeredSingleRequestURL);
            } catch { console.log(registeredSingleRequestURL, ": cannot retrieve this data request!") }
        }
    }

    const fetchedRequestAndWebId = [requestURIList, requestWebIdDocList, requestProfileIdList];
    return fetchedRequestAndWebId
}
// *** Fetch registered users (END) ***//

// *** Users respond to data request: approve/decline (START) ***//
function respondToRequest(answer_btns, requestContentList) {
    answer_btns.forEach(function (ans_btn) {
        ans_btn.addEventListener("click", function (e) {
            e.preventDefault();
            const style = e.currentTarget.classList
            // find which request the user is reponding
            const index = style.value.split(' ').pop().split('_')[1];
            const selectedRequest = requestContentList[index];

            // Participate in a data request
            if (style.contains('approve')) {
                const fetchParticipateRequestId = selectedRequest.url;

                fetchRequestURL(fetchParticipateRequestId).then(fetchedRequestListRef => {
                    change_participation(fetchedRequestListRef, fetchParticipateRequestId, "http://www.w3.org/ns/dpv#consented").then(()=> {
                        if(!alert('You have accepted the request!')){window.location.reload(); }
                    }); //
                });

                
            }
            else if (style.contains('deny')) { //sendFeedback
                const fetchParticipateRequestId = selectedRequest.url;

                fetchRequestURL(fetchParticipateRequestId).then(fetchedRequestListRef => {
                    change_participation(fetchedRequestListRef, fetchParticipateRequestId, "http://www.w3.org/ns/dpv#declined").then(()=> {
                        if(!alert('You have declined the request!')){window.location.reload(); }
                    }); //alert('You have declined the request!')
                });
            }
            else if (style.contains('cancel')) { //sendFeedback
                const fetchParticipateRequestId = selectedRequest.url;

                fetchRequestURL(fetchParticipateRequestId).then(fetchedRequestListRef => {
                    change_participation(fetchedRequestListRef, fetchParticipateRequestId, "http://www.w3.org/ns/dpv#open").then(()=> {
                        if(!alert('You have withdrawed the decision!')){window.location.reload(); }
                    }); //alert('You have declined the request!')
                });

               
            }
        });
    });
}
// *** Users respond to data request: approve/decline (END) ***//

async function change_participation(fetchedRequestListRef,fetchParticipateRequestId, status) {
    const featched_requestParticipation = fetchedRequestListRef.getSubject(fetchParticipateRequestId);
    featched_requestParticipation.setRef("http://www.w3.org/ns/dpv#participation", status);
    await fetchedRequestListRef.save()
}

async function dataElement_getRecommender(input) {

    let response = await fetch("https://data.bioontology.org/recommender?input=" + input + "&apikey=21646475-b5a0-4e92-8aba-d9fcfcfea388");
    let data = await response.json();
    let item = [];
    let asInputOntology = "";

    for (let i = 0; i < data.length; i++) {
        item.push({ Text: data[i]['ontologies'][0]['acronym'], FoundURI: data[i]['ontologies'][0]['@id'], Score: data[i]['evaluationScore'] });
        asInputOntology += data[i]['ontologies'][0]['acronym'];
        if (i != data.length - 1) {
            asInputOntology += ",";
        }
    }
    return asInputOntology //item
}

async function dataElement_getAnnotator(asInputOntology, input) {

    let response = await fetch("https://data.bioontology.org/annotator?text=" + input + "&ontologies=" + asInputOntology + "&longest_only=false&exclude_numbers=false&whole_word_only=true&exclude_synonyms=false&expand_class_hierarchy=true&class_hierarchy_max_level=999&mapping=all&apikey=21646475-b5a0-4e92-8aba-d9fcfcfea388");
    let data = await response.json();
    let asInputAnnotator = [];


    for (let i = 0; i < data.length; i++) {
        asInputAnnotator.push({ URI: data[i]['annotatedClass']['@id'], Ont: data[i]['annotatedClass']['links']["ontology"].split("/ontologies/")[1] });
    }
    return asInputAnnotator;
}


async function dataElement_getUsers(annotator, input) {

    let response = await fetch("https://data.bioontology.org/search?q=" + input + "&ontology=" + annotator['Ont'] + "&subtree_root_id=" + annotator['URI'] + "&apikey=21646475-b5a0-4e92-8aba-d9fcfcfea388");
    let data = await response.json();

    return data;
}


// *** Button rections (START) ***//
btns.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
        e.preventDefault();
        const styles = e.currentTarget.classList;

        // Fetch data from the files all triples or objects
        if (styles.contains('fetchObjects') || styles.contains('fetchTriples')) {

            if (styles.contains('fetchTriples')) {
                var fetchFrom = document.getElementById("fetchFromTriples").value;
            }
            else {
                var fetchFrom = document.getElementById("fetchFromObjects").value;
            }

            const fetchSubject = document.getElementById("fetchSubject").value;
            const fetchPredicate = document.getElementById("fetchPredicate").value;
            const getTriplesOption = styles.contains('fetchTriples');

            getTriplesObjects(fetchFrom, fetchSubject, fetchPredicate, getTriplesOption).then(getFetchedData => {
                const tables = document.querySelectorAll(".table");

                // print the triples as "subject" "predicate" "object"
                let tripleResults = [];
                if (styles.contains('fetchTriples')) {
                    for (let i = 0; i < getFetchedData.length; i++) {
                        tripleResults.push({ Subject: getFetchedData[i].subject.id, Predicate: getFetchedData[i].predicate.id, Object: getFetchedData[i].object.id })
                    }
                    tables.forEach(function (table) {
                        if (table.classList.contains("triples")) {
                            printTable(table, tripleResults, false);
                        }
                    });
                }
                else if (styles.contains('fetchObjects') && fetchSubject) {
                    for (let i = 0; i < getFetchedData.length; i++) {
                        if (fetchPredicate) {
                            tripleResults.push({ Object: getFetchedData[i] })
                        }
                        else {
                            tripleResults.push({ Predicate: getFetchedData[i].predicate.id, Object: getFetchedData[i].object.id })
                        }
                    }
                    tables.forEach(function (table) {
                        if (table.classList.contains("objects")) {
                            printTable(table, tripleResults, false);
                        }
                    });
                }
            });
        }

        else if (styles.contains('addSingleTriple')) {
            let tripleResults = [];
            const tables = document.querySelectorAll(".table");
            const addTriplePredicate = document.getElementById("addTriplePredicate").value;
            const addTripleObject = document.getElementById("addTripleObject").value;

            tripleResults.push({ Predicate: addTriplePredicate, Object: addTripleObject });
            tables.forEach(function (table) {
                if (table.classList.contains("addedTable")) {
                    printTable(table, tripleResults, true);
                }
            });
        }

        // Add data/triples to the data file (this can be changed as user wants)
        else if (styles.contains('addData')) {
            const fileLocation = document.getElementById("fileLocation").value;
            const profileHead = "https://" + fileLocation.substring(fileLocation.lastIndexOf("https://") + 8, fileLocation.lastIndexOf("/")) + "/";
            const fileName = document.getElementById("fileName").value;

            var addedTableDict = []
            const addedTable = document.getElementById("addedTable");
            var rowLength = addedTable.rows.length; // gets rows of table
            for (let i = 1; i < rowLength; i++) { //loops through rows    
                var oCells = addedTable.rows.item(i).cells; //gets cells of current row  
                addedTableDict.push({ Predicate: oCells.item(0).innerHTML, Object: oCells.item(1).innerHTML }) //oCells;
            }

            getNotesList(profileHead, fileLocation, fileName).then(fetchedNotesListRef => {
                addNote(profileHead, addedTableDict, fetchedNotesListRef).then(success => {
                    const fetchedDoc = document.getElementById("addTableMessage");
                    fetchedDoc.textContent = "Above triples are saved in " + fileName;
                    alert("Your editing is successful!")
                }).catch((err) => {
                    const fetchedDoc = document.getElementById("addTableMessage");
                    fetchedDoc.textContent = err.message
                });
            });
        }

        // Check if the data request exists already
        else if (styles.contains('checkExtRequest')) {

            getWebId().then(webId => {
                const fetchProfile = webId;
                getRequestList(fetchProfile).then(fetchedRequestListRef => {

                    const firstRequestMessage = document.getElementById("firstRequestMessage");
                    firstRequestMessage.textContent = "Your have 'public/request.ttl' in your Solid Pod already. Ready to submit a data request!"
                });
            });
        }

        // Add requested data elements
        else if (styles.contains('addRequestedData')) {

            if (!document.getElementById("loader") && document.getElementById("addTriplePredicate").value.length > 2) {
                const loader = document.createElement("div");
                loader.className = "ui active inline loader";
                loader.id = "loader"
                document.getElementById('input_addedField').appendChild(loader);
            }

            if  (document.getElementById("loader").className == "ui active inline loader") {
                dataElement_getRecommender(document.getElementById("input_purpose").value).then(asInputOntology => {
                    let dataCategoryInput = document.getElementById("input_personaldatacategory").value.split(',');
                    let annotatorInput = '';
                    if (dataCategoryInput.length > 1) {
                        for (let n = 0; n < dataCategoryInput.length; n++) {
                            annotatorInput = annotatorInput + ' ' + dataCategoryInput[n]
                        }

                    } else {
                        annotatorInput = document.getElementById(document.getElementById("input_personaldatacategory").value).textContent;
                        console.log(annotatorInput);
                    }

                    dataElement_getAnnotator(asInputOntology, annotatorInput).then(asInputAnnotator => {
                        let item = [];
                        console.log(asInputAnnotator.length)
                        asInputAnnotator.map(annotator => {
                            dataElement_getUsers(annotator, document.getElementById("addTriplePredicate").value).then(data => {
                                if (data['collection'].length > 0) {
                                    item.push(data['collection']);
                                }
                            }).catch(e => { })
                        })
                    })
                })
                const addRequestedDataMessage = document.getElementById("input_addRequestedDataMessage");
                const addRequestedDataList = addRequestedDataMessage.textContent.split('\r\n');
                addRequestedDataMessage.setAttribute('style', 'white-space: pre;');

                const request_data = document.getElementById("addTriplePredicate").value;

                if (!addRequestedDataList.includes(request_data) && request_data.length > 0) {
                    addRequestedDataList.push(request_data);
                    addRequestedDataMessage.textContent += request_data + '\r\n';
                }
                const request_data_list = addRequestedDataMessage.textContent.split('\r\n')
                request_data_list.pop()

                document.getElementById("loader").style.display = "none";
                document.getElementById("addTriplePredicate").value = "";

            }

        }

        // Submit a new data request 
        else if (styles.contains('submitRequest')) {
            getWebId().then(webId => {

                const fetchProfile = webId

                const request_classPurpose = document.getElementById("input_classPurpose").value.split(',');

                const request_purpose = document.getElementById("input_purpose").value;

                const request_title = document.getElementById("input_title").value;

                const request_personalDataCategory = document.getElementById("input_personaldatacategory").value.split(',');

                const addRequestedDataMessage = document.getElementById("input_addRequestedDataMessage");
                const request_data = addRequestedDataMessage.textContent.split('\r\n')
                request_data.pop()

                const request_period = new Date(document.getElementById("input_period").value);
                const request_numInstance = document.getElementById("input_numInstance").value;

                // const request_ontology = document.getElementById("input_ontologyDataElement").value.split(',');

                const request_dataProcessingCategory = document.getElementById("input_dataProcessingCategory").value.split(',');

                const request_selectModelObj = document.getElementById("input_model")
                const request_model = document.getElementById("input_model").value;//request_selectModelObj.options[request_selectModelObj.selectedIndex].value;

                const request_consequence = document.getElementById("input_consequence").value;

                // const request_selectRecipientObj = document.getElementById("data_recipient")
                // const request_recipient = request_selectRecipientObj.options[request_selectRecipientObj.selectedIndex].value;

                const request_input_token = document.getElementById("input_token").value;

                const addRequestContent = {
                    'purposeClass': request_classPurpose,
                    'title' : request_title,
                    'purpose': request_purpose,
                    'personalDataCategory': request_personalDataCategory,
                    // 'ontology': request_ontology,
                    'data': request_data,
                    'period': request_period,
                    'numInstance': request_numInstance,
                    'dataProcessingCategory': request_dataProcessingCategory,
                    'model': request_model,
                    'consequence': request_consequence,
                    // 'recipient':request_recipient,
                    'token': request_input_token
                };
                getRequestList(fetchProfile).then(fetchedRequestListRef => {
                    addRequest(fetchProfile, addRequestContent, fetchedRequestListRef).then(outcome => {
                        alert(outcome);
                    });
                });
            });
        }
    });
});
// *** Button rections (END) ***//