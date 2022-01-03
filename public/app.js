const state = {
    token:false,
}

const formatRequestUrl = (url, queryString) => {
        url = `${url}?` 
        for(const [queryStringKey, queryStringValue] of Object.entries(queryString)) {
            url = `${url}${queryStringKey}=${queryStringValue}&`
        }

        return url.substring(0, url.length - 1);
}

const sendRequest = async (headers, method, url, queryString, payload) => {
    if (queryString) url =  formatRequestUrl(url, queryString)
    
    const requestData = {}

    // if the token is set, put it on the header
    headers = typeof(headers) === "object" && headers !== null ? headers : {}
    if (state.token) headers["token"] = state.token.id;

    if (headers) requestData['headers'] = headers;
    if (method) requestData["method"] = method;
    if (payload) requestData["body"] = JSON.stringify(payload);
    
    let requestResult = await fetch(url, requestData);
    if (`${requestResult.status}`.startsWith("4") || `${requestResult.status}`.startsWith("5")) return false

    if (requestResult.status === 204) return true;

    let jsonData;
    if (requestResult.headers.get("Content-Type") === "application/json") jsonData = await requestResult.json()
    if (requestResult.headers.get("Content-Type") === "text/html") jsonData = await requestResult.text();
  
    return jsonData;
}


const getFormData = (formId) => {
    const inputs = Array.from(document.querySelector(formId).querySelectorAll("input"));
    
    const selects = Array.from(document.querySelector(formId).querySelectorAll("select"))
    const merged = [...inputs, ...selects]
    const inputData = {}

    merged.forEach(input => {

        if (input.type === "checkbox") {inputData[input.name] = input.checked}
        else {
            inputData[input.name] = input.value
        }
        
    })

    


    return inputData;
}

const SignupDataIsValid = (inputData) => {
    if (!inputData["firstName"]) return false;
    if (!inputData["lastName"]) return false;
    if (!inputData["phone"] || !inputData["phone"].trim().length === 10) return false;
    if (!inputData["password"]) return false ;
    if (!inputData["tosAgreement"]) return false;

    return true;
}

const signupUser = async (event) => {
    event.preventDefault();
    // input data    
    const inputData = getFormData("#accountCreate");
    // daten überprüfen
    if (!SignupDataIsValid(inputData)) return

    // request senden
    const requestValid = await sendRequest(null,"POST", "api/users", null,inputData)

    if (requestValid) window.location = "session/create"

}

const handleSignupPage = () =>  {

    // check if the user is on the signup page
    if (!document.body.classList.contains("accountCreate")) return;
    // event listener hinzufügen
    document.querySelector("#accountCreate").addEventListener("submit", signupUser)
}

const loginDataIsValid = (loginData) => {
    // phone and password
    const phone = typeof(loginData.phone) === "string" && loginData.phone.trim().length === 10 ? loginData.phone.trim() : false
    const password = typeof(loginData.password) === "string" && loginData.password.trim().length > 0 ? loginData.password.trim() : false

    if (!phone || !password) return false;

    return true
}

const saveTokenInLocalStorage = (token) => {
    window.localStorage.setItem("token", JSON.stringify(token))
}

const loginUser = async (event) => {
    event.preventDefault();

    // get the login data
    const data = getFormData("#sessionCreate")

    // validate the data
    if(!loginDataIsValid(data)) return

    // send the request
    const response = await sendRequest(null, "POST", "api/tokens", null, data)


    if (!response) return;

    state["token"] = response["token"];
    // set it in local storage
    saveTokenInLocalStorage(state["token"]);

    window.location = "checks/all"
}


const handleLoginPage = () => {

    if (!document.body.classList.contains("sessionCreate")) return

    document.querySelector("#sessionCreate").addEventListener("submit", loginUser)
}

const logUserOut = () => {
    // destroy the token
    window.localStorage.removeItem("token")
    state["token"] = false

    // redirect to the logout page
    window.location = "session/deleted"
}

const handleLogoutPage = () => {
    // if the logout page is clicked
    const logoutButton = document.querySelector("#logoutButton")
    if (logoutButton) logoutButton.addEventListener("click", logUserOut)
    
}

const getTokenFromLocalStorage = () => {
    const token = window.localStorage.getItem("token")

    if (token === "false" || token==="undefined") return false;
    return JSON.parse(token);
    
}

const tokenIsValid = (token) => {
    if (!token) return false;
    const phone = typeof(token.phone) === "string" && token.phone.trim().length === 10 ? token.phone : false
    const id = typeof(token.id) === "string" && token.id.trim().length === 20 ? token.id : false 

    if (!phone || !id) return false;

    return true;

}

const setLoginStatus = (status) => {
    if (status === "logout") return document.body.classList.remove("loggedIn")

    document.body.classList.add("loggedIn")
}


const getTokenOnPageLoad = () => {
    // get the token from localstorage
    const token = getTokenFromLocalStorage();

    // validate the token
    if (!tokenIsValid(token)) return setLoginStatus("logout")

    state["token"] = token;
    // change the UI accordingly
    setLoginStatus("login")

}

const userDataIsValid = (userData) => {
    if (!userData) return false;

    const phone = typeof(userData.phone) === "string" && userData.phone.trim().length === 10 ? userData.phone.trim() : false;
    const firstName = typeof(userData.firstName) === "string" && userData.firstName.trim().length > 0 ? userData.firstName.trim() : false;
    const lastName = typeof(userData.lastName) === "string" && userData.lastName.trim().length > 0 ? userData.lastName.trim() : false;

    if (!phone || !firstName || !lastName) return false;

    return true;
}

const updateUserData = async (e) => {
    e.preventDefault();
    // get the data
    const userData = getFormData("#accountEdit1");
    // validate the data
    if (!userDataIsValid(userData)) return;

    // send the request
    await sendRequest(null, "PATCH", "api/users", null, userData)
}

const passwordIsValid = (data) => {
    if (!data) return false;

    const password = typeof(data.password) === "string" && data.password.trim().length > 0 ? data.password : false
    const phone = typeof(data.phone) === "string" && data.phone.trim().length === 10 ? data.phone.trim() : false;
    if (!password || !phone) return false;
    return true;
}

const updatePassword = async (e) => {
    e.preventDefault()
    // get the data
    const passwordData = getFormData("#accountEdit2");
    passwordData.phone = state.token.phone;
    // validate the data
    if (!passwordIsValid(passwordData)) return;
    
    // send the request
    await sendRequest(null, "PATCH", "api/users", null, passwordData)
}

const populateUserDataForm = (userData) => {
    const inputs = Array.from(document.querySelector("#accountEdit1").querySelectorAll("input"));
    

    inputs.forEach(input => {
        input.value = userData[input.name];
    })

}

const preFillUserDataForm = async () => {
    // get the user data form the api
    const response = await sendRequest(null, "GET", "api/users",{phone:state.token.phone}, null )
    const userData = response.user;
    
    // check it 
    
    if (!userDataIsValid(userData)) return;

    // populate the input fields
    populateUserDataForm(userData);
}


const deleteUser = async (event) => {
    event.preventDefault()
    
    // get the phone number
    const phone = state.token.phone

    // send the delet request
    const response = await sendRequest(null, "DELETE", "api/users", {phone}, null);

    // delete the entry on the state varaible
    state.token = false;

    // rediect
    window.localStorage.removeItem("token")
    window.location = "account/deleted"
    
}

const handleAccountEditPage = async () => {
    if (!document.body.classList.contains("accountEdit")) return;
    
    redirectNotLoggedIn();
    
    await preFillUserDataForm();
    
    document.querySelector("#accountEdit1").addEventListener("submit", updateUserData)
    
    document.querySelector("#accountEdit2").addEventListener("submit", updatePassword)

    document.querySelector("#accountEdit3").addEventListener("submit", deleteUser)
    
}

const redirectNotLoggedIn = () => {
    // if the token is not set redirect to the login page
    if (!state.token) window.location = "session/create"
}

const formatSuccessCodes = (data) => {
    const successCodes = []
    Object.entries(data).forEach(el => {
        const [key,value] = el;
        if (key.startsWith("successCodes") && value) {
            successCodes.push(parseInt(key.split("_")[1]));
        } 
    })
    return successCodes;
}

const checkIsValid = (data) => {
    if (!data) return false;

    const protocol = typeof(data.protocol) === "string" && ["http", "https"].includes(data.protocol.trim()) ? true  : false;
    const url =typeof(data.url) === "string" && data.url.length > 0 ? true : false
    const method = typeof(data.httpmethod) === "string" && ["get", "post", "put", "delete"].includes(data.httpmethod.trim()) ? true : false
    const timeoutSeconds = typeof(data.timeoutSeconds) === "string" && ["1", "2", "3", "4", "5"].includes(data.timeoutSeconds.trim()) ? true : false;
  
    if (formatSuccessCodes(data).length <= 0 || !protocol ||!url || !method ||!timeoutSeconds) return false;
    
    return true;


}

const createCheck = async (event) => {
    event.preventDefault();

    // check if the user is logged in
    redirectNotLoggedIn();

    // et the data
    const data = getFormData("#checksCreate");
    // validate the data
    if (!checkIsValid(data)) return;

    // format the statusCodes
    const newData = {
        method:data.httpmethod,
        successCodes:formatSuccessCodes(data),
        timeoutSeconds:parseInt(data.timeoutSeconds),
        url:data.url,
        protocol: data.protocol
    }

    // send the request
    const response = await sendRequest(null, "POST", "api/checks", null, newData);

    if (!response) return console.log("Fehler beim erstellen aufgetreten")

    // send the user back to the dashboard
    window.location = "checks/all"
}

const handleCreateCheckPage = () => {
    if (!document.body.classList.contains("checksCreate")) return;

    document.querySelector("#checksCreate").addEventListener("submit", createCheck)
}

const getAllChecksFromUser = async () => {
    // phone number
    const phone = state.token.phone;

    // get the individual user
    const response = await sendRequest(null, "GET", "api/users", {phone},null)
    if (response) return response.user.checks;
    return []

}

const getCheck = async(checkId) => {
    const response = await sendRequest(null, "GET", "api/checks", {id:checkId}, null);
    return response.data
}

const renderCheck = (check) => {
    const html = 
        `<tr>
        <th>${check.method}</th>
        <th>${check.protocol}</th>
        <th>${check.url}</th>
        <th>${check.state}</th>
        <th>SuccessCodes ${check.successCodes.join(" ")} <a href="checks/edit?id=${check.id}"> Edit </a></th>
        </tr>`

    document.querySelector("tbody").insertAdjacentHTML("beforeend", html);
}

const renderNoChecksMessage = () => {
    document.querySelector("#noChecksMessage").style.display = "block";
}

const handleChecksListPage = async () => {
    if (!document.body.classList.contains("checksList")) return;

    redirectNotLoggedIn();
    // get the list of all of the checks from the user object
    const checkIdList = await getAllChecksFromUser();
    if (!checkIdList || checkIdList.length <= 0) return renderNoChecksMessage();
    // get all of the individual checks 
    const checks = await Promise.all(checkIdList.map(id => getCheck(id)));
    // render each individual check
    checks.forEach(check => {renderCheck(check)})
}

const displayCheckOnEditPage = (check) => {
    
    const idToValue = {
        ".displayIdInput":check.id,
        ".displayStateInput":check.state,
        ".protocolInput":check.protocol,
        ".urlInput":check.url,
        ".methodInput":check.method,
        ".timeoutInput":check.timeoutSeconds
    }

    for(const [key, value] of Object.entries(idToValue)) {
        document.querySelector(key).value = value;
    }

    Array.from(document.querySelectorAll(".successCodesInput")).forEach(input => {
        if (check.successCodes.includes(parseInt(input.value))) input.checked = true
    })

}

const preRenderEditCheckForm = async () => {
    // GET THE ID FROM THE URL
    const id = new URLSearchParams(window.location.search).get("id");
    
    if (id.trim().length !== 20) return;

    // GET THE CORRESPONDING CHECK
    const check = await getCheck(id);
    // DISPLAY THE CHECK
    displayCheckOnEditPage(check)
}

const editCheck = async(event) => {
    event.preventDefault()
    // get the data
    const checkData = getFormData("#checksEdit1");
    
    // validate the data
    if(!checkIsValid(checkData)) return;
    
    // transform the data
    const newData = {
        id:checkData.displayId,
        method:checkData.httpmethod,
        successCodes:formatSuccessCodes(checkData),
        timeoutSeconds:parseInt(checkData.timeoutSeconds),
        url:checkData.url,
        protocol: checkData.protocol
    
    }
    // send the data
    const response = await sendRequest(null, "PATCH", "api/checks", null, newData )

    if (response) window.location = "checks/all"
    // redirect to the dashboard
}

const deleteCheck = async(e) => {
    e.preventDefault();
    const id = new URLSearchParams(window.location.search).get("id");

    // send request to delte
    const response = await sendRequest(null, "DELETE", "api/checks", {id}, null);

    if (response) window.location = "checks/all" 

}

const handleChecksEditPage = async () => {

    if (!document.body.classList.contains("checksEdit")) return;

    redirectNotLoggedIn();

    // render the existing check into the form
    await preRenderEditCheckForm();

    // ADD EVENT HANDLER FOR EDIT
    document.querySelector("#checksEdit1").addEventListener("submit", editCheck);
    
    // ADD EVENT HANDLER FOR DELETING
    document.querySelector("#checksEdit2").addEventListener("submit", deleteCheck);
}

const init = async () => {
    getTokenOnPageLoad();
    
    handleSignupPage()
    
    handleLogoutPage();
    
    handleLoginPage();
    
    handleLogoutPage();

    handleCreateCheckPage();

    await handleChecksEditPage();

    await handleChecksListPage();
    
    await handleAccountEditPage();

}


init();