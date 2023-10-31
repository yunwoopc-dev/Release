function createDropdown(divId, os, appcastUrl, fontawesome_class) {
    const container = document.getElementById(divId);
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";

    const versionLink = document.createElement("a");
    versionLink.id = `${divId}-${os}-LatestVersionLink`;
    versionLink.href = "#";
    versionLink.innerHTML = "Loading...";
    dropdown.appendChild(versionLink);

    const button = document.createElement("button");
    button.id = "dropdown-button";
    button.innerHTML = "&#9660;";
    button.onclick = function () {
        toggleDropdown(`${divId}-${os}`);
    };
    dropdown.appendChild(button);

    const dropdownContent = document.createElement("div");
    dropdownContent.className = "dropdown-content";
    dropdownContent.id = `${divId}-${os}-VersionList`;
    dropdown.appendChild(dropdownContent);

    container.appendChild(dropdown);

    fetchWithRetry(appcastUrl)
        .then((res) => res.text())
        .then((data) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "application/xml");
            const items = xmlDoc.querySelectorAll("item");

            // Sort by version
            const sortedItems = [...items].sort((a, b) => {
                const versionA = a
                    .querySelector("enclosure")
                    .getAttribute("sparkle:version");
                const versionB = b
                    .querySelector("enclosure")
                    .getAttribute("sparkle:version");
                return compareVersions(versionA, versionB);
            });

            let hasVersions = false; // Track if we have added any versions

            for (let i = 0; i < sortedItems.length; i++) {
                const enclosure = sortedItems[i].querySelector("enclosure");
                const link = enclosure.getAttribute("url");
                const version = enclosure.getAttribute("sparkle:version");

                if (i === 0) {
                    versionLink.innerHTML =
                        (fontawesome_class != null
                            ? `<i class="${fontawesome_class} margin-right-15"></i>`
                            : ``) + `${os} : ${version}`;
                    versionLink.href = link;
                } else {
                    const versionItem = document.createElement("a");
                    versionItem.href = link;
                    versionItem.innerHTML = `${version}`;
                    dropdownContent.appendChild(versionItem);
                    hasVersions = true;
                }
            }

            // If no additional versions were added
            if (!hasVersions) {
                const noVersionMsg = document.createElement("a");
                noVersionMsg.href = "#";
                noVersionMsg.textContent = "처음 게시된 버전입니다.";
                dropdownContent.appendChild(noVersionMsg);
            }
        });
}

async function fetchWithRetry(url, maxRetries = 3) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (maxRetries <= 0) {
            throw new Error("Max retries reached");
        }
        console.log(`Attempt failed. Retrying... (${maxRetries} retries left)`);
        return fetchWithRetry(url, maxRetries - 1);
    }
}

function compareVersions(a, b) {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        if ((aParts[i] || 0) > (bParts[i] || 0)) return -1;
        if ((aParts[i] || 0) < (bParts[i] || 0)) return 1;
    }
    return 0;
}

function toggleDropdown(dropdownId) {
    const dropdownContent = document.getElementById(
        dropdownId + "-VersionList"
    );

    if (dropdownContent.style.display === "block") {
        dropdownContent.style.display = "none";
    } else {
        // Close all other dropdowns
        const allDropdownContents =
            document.querySelectorAll(".dropdown-content");
        allDropdownContents.forEach(
            (content) => (content.style.display = "none")
        );

        dropdownContent.style.display = "block";
    }
}

document.addEventListener("click", function (event) {
    // 클릭한 대상이 드롭다운 버튼이면 함수를 종료합니다.
    if (
        event.target.id === "dropdown-button" ||
        event.target.closest(".dropdown")
    ) {
        return;
    }
    const dropdowns = document.querySelectorAll(".dropdown-content");
    dropdowns.forEach((dropdown) => {
        dropdown.style.display = "none";
    });
});
