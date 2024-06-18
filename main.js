(function(storyContent) {

    // Create ink story from the content using inkjs
    var story = new inkjs.Story(storyContent);
const currentVersion = 'v3';  // Change this version number when you update your code
const storedVersion = localStorage.getItem('appVersion');
story.BindExternalFunction("get_name", () => {
    // 'prompt' is a built-in Javascript method
    let playerName = prompt("Welcome to Pony Adventure! What is your name?", "Anon");

    // Check if playerName is null or empty
    if (playerName === null || playerName === "") {
        // Set a default name if the player doesn't enter anything
        playerName = "Anon";
    }

    // Set the playerName in story.variablesState
    story.variablesState["playerName"] = playerName;

    // Return the playerName
    return playerName;
});

	
	let playerName = 'Anon'
		let currentLocation = "Nowhere"
		let currentLevel = 1;
		let currentHp = 0;
		let maxHp = 0;
		let will = 0;
		let maxWill = 0;
		let lust =0;
		let maxLust = 100;
		let currentXp= 0;
		let needXp= 0;
	    let Attack_Mod = 0
		let hasWings = false;
		let hasMagic = false;
		function percent(x,y){
			return (x/y)*100;
		};
// Function to roll a specified-sided die
function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

  function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }




function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}




function calculateDamage(damage) {
  if (damage) {
    const parts = damage.split('d');
    if (parts.length === 2) {
      const numDice = parseInt(parts[0], 10);
      const sides = parseInt(parts[1], 10);
      let total = 0;
      for (let i = 0; i < numDice; i++) {
        total += rollDie(sides);
      }
      return total;
    }
    // Check for additional fixed amount (e.g., +2)
    const fixedAmount = parseInt(damage.split('+')[1], 10);
    if (!isNaN(fixedAmount)) {
      return fixedAmount;
    }
  }
  return 0;
}

//INVENTORY SYSTEM

 let inventory = [];

function updateInventoryUI() {
  const itemsList = document.getElementById('items');
  itemsList.innerHTML = '';

  inventory.forEach((item, index) => {
    const li = document.createElement('li');

    // Add an image to the item
    const img = document.createElement('img');
    img.src = item.imageSrc; // Replace with the actual image source
    img.classList.add('inventory-image');
    li.appendChild(img);

    // Display item information
    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.name;
    li.appendChild(nameSpan);

    const descriptionSpan = document.createElement('span');
    descriptionSpan.textContent = item.description;
    li.appendChild(descriptionSpan);

    // Add "Sell" and "Equip" buttons
    const sellButton = createButton('Drop', () => dropItem(item));
    const equipButton = createButton('Equip', () => equipItem(item));
    const useButton = createButton('Use', () => performItemAction(item));

    // Display quantity next to the buttons
    const quantitySpan = document.createElement('span');
    quantitySpan.textContent = `${item.quantity}`;
    li.appendChild(quantitySpan);

    // Add buttons only if applicable
    if (item.canEquip) {
      li.appendChild(equipButton);
    } else {
      // Add a class to the button and disable it if not applicable
      equipButton.classList.add('disabled');
      equipButton.disabled = true;
      li.appendChild(equipButton);
    }

    if (item.hasAction) {
      li.appendChild(useButton);
    } else {
      // Add a class to the button and disable it if not applicable
      useButton.classList.add('disabled');
      useButton.disabled = true;
      li.appendChild(useButton);
    }

    if (item.isDroppable) {
      li.appendChild(sellButton);
    } else {
      // Add a class to the button and disable it if not applicable
      sellButton.classList.add('disabled');
      sellButton.disabled = true;
      li.appendChild(sellButton);
    }

    itemsList.appendChild(li);

    if (item.quantity === 0) {
      unequipItem(item);
    }
  });
}
  
function addItemToInventory(item) {
  const existingItemIndex = inventory.findIndex(existingItem => existingItem.name === item.name);

  if (existingItemIndex !== -1) {
    // If the item already exists, increase the quantity
    inventory[existingItemIndex].quantity += item.quantity;
  } else {
    // If the item doesn't exist, add a new object with the same properties to the inventory
    inventory.push({ ...item });
  }

  updateInventoryUI();
}

function removeItemFromInventory(itemToRemove) {
  const indexToRemove = inventory.findIndex(item => item.name === itemToRemove.name);
  if (indexToRemove !== -1) {
    inventory.splice(indexToRemove, 1);
    updateInventoryUI();
  }
}

function dropItem(item) {
  // Decrease the quantity of the item in the inventory
  const existingItemIndex = inventory.findIndex(existingItem => existingItem.name === item.name);

  if (existingItemIndex !== -1) {
    if (inventory[existingItemIndex].quantity > 1) {
      // If the quantity in the inventory is greater than 1, decrement it
      inventory[existingItemIndex].quantity--;
    } else {
      // If the quantity is 1, remove the item from the inventory
      inventory.splice(existingItemIndex, 1);

      // Call a function to unequip the item if it was removed from inventory
      unequipItem(item);
    }

    // Update the UI for the inventory
    updateInventoryUI();

    // Check if the item is 'Bits' and modify the Ink variable (if applicable)
    if (item.name === 'Bits') {
      modifyInkBits(-1); // Subtract 1 from Ink variable for dropped 'Bits'
    }
  }
}

const equippedItems = [];
let currentItem;
function equipItem(item) {
	currentItem = item;
  // Check if the item is not already equipped
  const isItemEquipped = equippedItems.some(equippedItem => equippedItem.name === item.name);

  if (!isItemEquipped) {
    // Check if there is already an item with damage equipped
    const hasDamageItemEquipped = equippedItems.some(equippedItem => equippedItem.damage !== undefined);

    if (hasDamageItemEquipped) {
      // Unequip the item with damage before equipping the new one
      const itemToUnequip = equippedItems.find(equippedItem => equippedItem.damage !== undefined);
      unequipItem(itemToUnequip);
    }

    // Find the corresponding item in the inventory
    const inventoryItemIndex = inventory.findIndex(inventoryItem => inventoryItem.name === item.name);

    if (inventoryItemIndex !== -1) {
      // Reference the item from the inventory and add it to the equipped items without decreasing the quantity
      const inventoryItem = inventory[inventoryItemIndex];
      equippedItems.push({ ...inventoryItem, quantity: 1 });

      // Update UI for both inventory and equipped items
      updateInventoryUI();
      updateEquippedItemsUI();
	  
	        // Calculate damage for the newly equipped item
      const damageAmount = calculateDamage(item.damage);
      console.log(`Equipped ${item.name}. Damage: ${damageAmount}`);
    } else {
      console.log(`Item ${item.name} not found in inventory.`);
    }
  } else {
    console.log(`${item.name} is already equipped.`);
  }
}

function updateEquippedItemsUI() {
  const equippedItemsList = document.getElementById('equippedItems');
  equippedItemsList.innerHTML = '';

  equippedItems.forEach((equippedItem, index) => {
    const li = document.createElement('li');

    // Add an image to the equipped item
    const img = document.createElement('img');
    img.src = equippedItem.imageSrc; // Replace with the actual image source
	img.classList.add('inventory-image');
    li.appendChild(img);



    // Display equipped item information
    const nameSpan = document.createElement('span');
    nameSpan.textContent = equippedItem.name;
    li.appendChild(nameSpan);

    const descriptionSpan = document.createElement('span');
    descriptionSpan.textContent = equippedItem.description;
    li.appendChild(descriptionSpan);

    // Display an "Unequip" button


    const unequipButton = createButton('Unequip', () => unequipItem(equippedItem));
    li.appendChild(unequipButton);

    equippedItemsList.appendChild(li);
  });
}

function unequipItem(item) {
  const indexToRemove = equippedItems.findIndex(equippedItem => equippedItem.name === item.name);

  if (indexToRemove !== -1) {
    equippedItems.splice(indexToRemove, 1);
    updateEquippedItemsUI(); // Update the UI for the equipped items
  }
}

function performItemAction(item) {
    // Add logic here for the action of the item
const existingItemIndex = inventory.findIndex(existingItem => existingItem.name === item.name);

  if (existingItemIndex !== -1) {
    if (inventory[existingItemIndex].quantity > 1) {
      // If the quantity in the inventory is greater than 1, decrement it
      inventory[existingItemIndex].quantity--;
    } else {
      // If the quantity in the inventory is 1 or less, remove the item from the inventory
      inventory.splice(existingItemIndex, 1);

      // Call a function to unequip the item if it was removed from inventory
      unequipItem(item);
    }

    // Update the UI for the inventory
    updateInventoryUI();
  }
    if (item.name === 'Minor Health Potion') {
        // Assuming healthPotion heals by 20, you can set it to any value
        const healingAmount = getRandomInt(1, 4) + getRandomInt(1, 4);;
        currentHp += healingAmount+2;

        // Ensure health doesn't exceed the maximum value, e.g., 100
        currentHp = Math.min(currentHp, maxHp);

        console.log(`${item.name} has been used. Health +${healingAmount}. Current Health: ${currentHp}`);
    } else {
        console.log(`${item.name} has been used for its special action.`);
    }
	if (item.name === 'Orange') {
        const healingAmount = getRandomInt(1, 4) + getRandomInt(1, 4);
        currentHp += healingAmount+2;

        // Ensure health doesn't exceed the maximum value, e.g., 100
        currentHp = Math.min(currentHp, maxHp);

        console.log(`${item.name} has been used. Health +${healingAmount}. Current Health: ${currentHp}`);
    } else {
        console.log(`${item.name} has been used for its special action.`);
    }
	
		if (item.name === 'Orange Juice') {
        const healingAmount = getRandomInt(1, 4) + getRandomInt(1, 4)  + getRandomInt(1, 4)  + getRandomInt(1, 4) ;
        currentHp += healingAmount+4;

        currentHp = Math.min(currentHp, maxHp);

        console.log(`${item.name} has been used. Health +${healingAmount}. Current Health: ${currentHp}`);
    } else {
        console.log(`${item.name} has been used for its special action.`);
    }
}

function modifyInkBits(amount) {
  if (story && story.variablesState && typeof story.variablesState["bits"] !== 'undefined') {
    console.log(`Current bits: ${story.variablesState["bits"]}`);
    console.log(`Modifying bits by: ${amount}`);

    story.variablesState["bits"] += amount;

    console.log(`Updated bits: ${story.variablesState["bits"]}`);

    // (Optional) Call other functions to update UI or game logic based on bits change
  } else {
    console.error("story.variablesState['bits'] is not defined or story/variablesState is not accessible.");
  }
}
function createItem(name, description, quantity, imageSrc, canEquip = false, hasAction = false, isDroppable = true, damage = null, price) {
  return { name, description, quantity, imageSrc, canEquip, hasAction, isDroppable, damage, price };
}
const npcSellers = {
    'Citrus': { 
	shopTitle: 'CITRUS\'\S ORANGES',
	inventory: [
	createItem('Orange', 'Restores a little bit of health', 5, 'IMAGE/Items/Food/tile103.png', false, true, false, '0', 0),
	createItem('Orange Juice', 'Restores  bit of health', 5, 'IMAGE/Items/Food/tile212.png', false, true, false, '0', 0)
	] 

		} 
};

function displayShopInventory(sellerName, shopTitle) {
    const currentSeller = npcSellers[sellerName];
    if (!currentSeller) {
        console.error(`Seller with name '${sellerName}' not found.`);
        return;
    }

    const currentInventory = currentSeller.inventory;


    // Add shop title
    const titleElement = document.createElement('h2');
	titleElement.classList.add('shop-title');
    titleElement.textContent = shopTitle;
    document.getElementById('story').appendChild(titleElement);

    // Create header row
	

    const headerRow = document.createElement('div');
    headerRow.classList.add('shop-header');
	
    
    const nameHeader = document.createElement('span');
    nameHeader.textContent = 'Name';
    headerRow.appendChild(nameHeader);

    const descriptionHeader = document.createElement('span');
    descriptionHeader.textContent = 'Description';
    headerRow.appendChild(descriptionHeader);

    const priceHeader = document.createElement('span');
    priceHeader.textContent = 'Price';
    headerRow.appendChild(priceHeader);

    const quantityHeader = document.createElement('span');
    quantityHeader.textContent = 'Quantity';
    headerRow.appendChild(quantityHeader);
	
	const emptyEndSpan = document.createElement('span');
	emptyEndSpan.textContent = '';
    headerRow.appendChild(emptyEndSpan);
	
    document.getElementById('story').appendChild(headerRow);

    currentInventory.forEach((item) => {
        // Check if the item is already in the story container
        const existingItemInStory = document.querySelector(`#story li[data-name="${item.name}"]`);

        if (!existingItemInStory) {
            // Create a new item element
            const li = document.createElement('li');
            li.classList.add('shop-item');
            li.setAttribute('data-name', item.name);

            // Add an image to the shop item
            const img = document.createElement('img');
            img.src = item.imageSrc; // Replace with the actual image source
            li.appendChild(img);

            // Display shop item information
            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;
            li.appendChild(nameSpan);

            const descriptionSpan = document.createElement('span');
            descriptionSpan.textContent = item.description;
            li.appendChild(descriptionSpan);
            
            const priceSpan = document.createElement('span');
            priceSpan.textContent = item.price;
            li.appendChild(priceSpan);
            
            const quantitySpan = document.createElement('span');
            quantitySpan.textContent = item.quantity;
            li.appendChild(quantitySpan);

            // Add "Buy" button
            const buyButton = createButton('Buy');
            buyButton.addEventListener('click', () => buyItemFromShop(item, sellerName));
            li.appendChild(buyButton);

            // Disable the buy button if quantity is zero or less
            if (item.quantity <= 0) {
                buyButton.disabled = true;
            }

            // Append the item to the story container
            document.getElementById('story').appendChild(li);
        } else {
            // Update the quantity of the existing item in the story container
            const existingQuantitySpan = existingItemInStory.querySelector('span:nth-child(5)'); // Assuming quantity is the  span
            existingQuantitySpan.textContent = item.quantity; // Update quantity
            
            // Disable the buy button if quantity is zero or less
            const buyButton = existingItemInStory.querySelector('button');
            if (item.quantity <= 0) {
                buyButton.disabled = true;
            } else {
                buyButton.disabled = false;
            }
        }
    });
}


function buyItemFromShop(item, sellerName) {
    const currentSeller = npcSellers[sellerName];
    if (story.variablesState["bits"] < item.price) {
        alert("You don't have enough bits to buy this item.");
        return;
    }

    modifyInkBits(-item.price);

    // Check if the item already exists in the inventory
    const existingItem = inventory.find(i => i.name === item.name);
    if (existingItem) {
        existingItem.quantity += 1; // Increase the quantity
    } else {
        // Add a new item to the inventory
        inventory.push({ ...item, quantity: 1 });
    }

    // Decrease the quantity of the item in the shop's inventory
    const shopItem = currentSeller.inventory.find(i => i.name === item.name);
    if (shopItem) {
        shopItem.quantity -= 1;
        if (shopItem.quantity <= 0) {
            shopItem.quantity = 0; // Set quantity to 0 if it becomes negative
		}
    }

    updateInventoryUI();
    displayShopInventory(sellerName);
}

if (storedVersion !== currentVersion) {
    // Clear localStorage or perform any other actions needed for the update
    localStorage.clear();
    localStorage.setItem('appVersion', currentVersion);
}
	// Here's the function
	


    var savePoint = "";

    let savedTheme;
    let globalTagTheme;

    // Global tags - those at the top of the ink file
    // We support:
    //  # theme: dark
    //  # author: Your Name
    var globalTags = story.globalTags;
    if( globalTags ) {
        for(var i=0; i<story.globalTags.length; i++) {
            var globalTag = story.globalTags[i];
            var splitTag = splitPropertyTag(globalTag);

            // THEME: dark
            if( splitTag && splitTag.property == "theme" ) {
                globalTagTheme = splitTag.val;
            }

            // author: Your Name
            else if( splitTag && splitTag.property == "author" ) {
                var byline = document.querySelector('.byline');
                byline.innerHTML = "by "+splitTag.val;
            }
        }
    }

    var storyContainer = document.querySelector('#story');
    var outerScrollContainer = document.querySelector('.outerContainer');
	var bodyContainer = document.querySelector('body');
    // page features setup
    setupTheme(globalTagTheme);
    var hasSave = loadSavePoint();
    setupButtons(hasSave);

    // Set initial save point
    savePoint = story.state.toJson();

    // Kick off the start of the story!
    continueStory(true);

    // Main story processing function. Each time this is called it generates
    // all the next content up as far as the next set of choices.
    function continueStory(firstTime) {

        var paragraphIndex = 0;
        var delay = 0.0;

        // Don't over-scroll past new content
        var previousBottomEdge = firstTime ? 0 : contentBottomEdgeY();

        // Generate story text - loop through available content
        while(story.canContinue) {

            // Get ink to generate the next paragraph
            var paragraphText = story.Continue();
            var tags = story.currentTags;

            // Any special tags included with this line
            var customClasses = [];
            for(var i=0; i<tags.length; i++) {
                var tag = tags[i];

                // Detect tags of the form "X: Y". Currently used for IMAGE and CLASS but could be
                // customised to be used for other things too.
                var splitTag = splitPropertyTag(tag);

                // AUDIO: src
                if( splitTag && splitTag.property == "AUDIO" ) {
                  if('audio' in this) {
                    this.audio.pause();
                    this.audio.removeAttribute('src');
                    this.audio.load();
                  }
                  this.audio = new Audio(splitTag.val);
                  this.audio.play();
                }

                // AUDIOLOOP: src
                else if( splitTag && splitTag.property == "AUDIOLOOP" ) {
                  if('audioLoop' in this) {
                    this.audioLoop.pause();
                    this.audioLoop.removeAttribute('src');
                    this.audioLoop.load();
                  }
                  this.audioLoop = new Audio(splitTag.val);
				  this.audioLoop.volume = 0.5
                  this.audioLoop.play();
                  this.audioLoop.loop = true;
                }
				
						
				if( splitTag && splitTag.property == "SHOP" ) {
                    sellerName = splitTag.val;
					if (npcSellers.hasOwnProperty(sellerName)) {
					const shopTitle = npcSellers[sellerName].shopTitle; // Get the shop title for the seller
					displayShopInventory(sellerName, shopTitle); // Pass the shop title to the function
					delay += 200.0;
					} else {
					console.error(`Seller '${sellerName}' not found in npcSellers.`);
    }
                }	
				if( splitTag && splitTag.property == "SHOPCLEAR" ) {
                    
					removeAll('h2')
    
                }	

                // IMAGE: src
                if( splitTag && splitTag.property == "IMAGE" ) {
                    var imageElement = document.createElement('img');
                    imageElement.src = splitTag.val;
                    storyContainer.appendChild(imageElement);

                    showAfter(delay, imageElement);
                    delay += 200.0;
                }
				
							

				// INPUT BAR: src
                if( splitTag && splitTag.property == "INPUT" ) {
                    var inputElement = document.createElement('input');
                   inputElement.type = 'text'; // Specify the type of input element
                inputElement.value = splitTag.val; // Use value to set the initial text
                inputElement.style.display = 'none'; // Hide the element initially
                storyContainer.appendChild(inputElement);

                showAfter(delay, inputElement); // Show element after delay
                delay += 200.0; // Increase delay for the next element
                }
                // LINK: url
                else if( splitTag && splitTag.property == "LINK" ) {
                    window.location.href = splitTag.val;
                }

                // LINKOPEN: url
                else if( splitTag && splitTag.property == "LINKOPEN" ) {
                    window.open(splitTag.val);
                }

                // BACKGROUND: src
                else if( splitTag && splitTag.property == "BACKGROUND" ) {
                    bodyContainer.style.backgroundImage = 'url('+splitTag.val+')';
                }

                // CLASS: className
                else if( splitTag && splitTag.property == "CLASS" ) {
                    customClasses.push(splitTag.val);
                }
				

                // CLEAR - removes all existing content.
                // RESTART - clears everything and restarts the story from the beginning
                else if( tag == "CLEAR" || tag == "RESTART" ) {
                    removeAll("p");
                    removeAll("#imageContainer img");

                    // Comment out this line if you want to leave the header visible when clearing
                    setVisible(".header", false);

                    if( tag == "RESTART" ) {
                        restart();
                        return;
                    }
                }
            }

            // Create paragraph element (initially hidden)
            var paragraphElement = document.createElement('p');
            paragraphElement.innerHTML = paragraphText;
            storyContainer.appendChild(paragraphElement);

            // Add any custom classes derived from ink tags
            for(var i=0; i<customClasses.length; i++)
                paragraphElement.classList.add(customClasses[i]);

            // Fade in paragraph after a short delay
            showAfter(delay, paragraphElement);
            delay += 200.0;
        }

        // Create HTML choices from ink choices
        story.currentChoices.forEach(function(choice) {
	// Wrapping in a timer function to allow images to load before calculating & scrolling to the bottom of the page 
        setTimeout(() => { 
            // Extend height to fit 
            // We do this manually so that removing elements and creating new ones doesn't 
            // cause the height (and therefore scroll) to jump backwards temporarily. 
            storyContainer.style.height = contentBottomEdgeY()+"px"; 

            if( !firstTime ) 
            scrollDown(previousBottomEdge); 

        }, 700);
            // Create paragraph with anchor element
            var choiceParagraphElement = document.createElement('button');
            choiceParagraphElement.classList.add("choice");
            choiceParagraphElement.innerHTML = `<a href='#'>${choice.text}</a>`
            storyContainer.appendChild(choiceParagraphElement);

            // Fade choice in after a short delay
            showAfter(delay, choiceParagraphElement);
            delay += 200.0;

            // Click on choice
            var choiceAnchorEl = choiceParagraphElement.querySelectorAll("a")[0];
            choiceAnchorEl.addEventListener("click", function(event) {

                // Don't follow <a> link
                event.preventDefault();

                // Remove all existing choices
                removeAll(".choice");

                // Tell the story where to go next
                story.ChooseChoiceIndex(choice.index);

                // This is where the save button will save from
                savePoint = story.state.toJson();

                // Aaand loop
                continueStory();
            });
        });

        // Extend height to fit
        // We do this manually so that removing elements and creating new ones doesn't
        // cause the height (and therefore scroll) to jump backwards temporarily.
        storyContainer.style.height = contentBottomEdgeY()+"px";

        if( !firstTime )
            scrollDown(previousBottomEdge);

    }

    function restart() {
        story.ResetState();

        setVisible(".header", true);

        // set save point to here
        savePoint = story.state.toJson();

        continueStory(true);

        outerScrollContainer.scrollTo(0, 0);
    }

    // -----------------------------------
    // Various Helper functions
    // -----------------------------------

    // Fades in an element after a specified delay
    function showAfter(delay, el) {
        el.classList.add("hide");
        setTimeout(function() { el.classList.remove("hide") }, delay);
    }

    // Scrolls the page down, but no further than the bottom edge of what you could
    // see previously, so it doesn't go too far.
    function scrollDown(previousBottomEdge) {

        // Line up top of screen with the bottom of where the previous content ended
        var target = previousBottomEdge;

        // Can't go further than the very bottom of the page
        var limit = outerScrollContainer.scrollHeight - outerScrollContainer.clientHeight;
        if( target > limit ) target = limit;

        var start = outerScrollContainer.scrollTop;

        var dist = target - start;
        var duration = 300 + 300*dist/100;
        var startTime = null;
        function step(time) {
            if( startTime == null ) startTime = time;
            var t = (time-startTime) / duration;
            var lerp = 3*t*t - 2*t*t*t; // ease in/out
            outerScrollContainer.scrollTo(0, (1.0-lerp)*start + lerp*target);
            if( t < 1 ) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // The Y coordinate of the bottom end of all the story content, used
    // for growing the container, and deciding how far to scroll.
    function contentBottomEdgeY() {
        var bottomElement = storyContainer.lastElementChild;
        return bottomElement ? bottomElement.offsetTop + bottomElement.offsetHeight : 0;
    }

    // Remove all elements that match the given selector. Used for removing choices after
    // you've picked one, as well as for the CLEAR and RESTART tags.
    function removeAll(selector)
    {
        var allElements = storyContainer.querySelectorAll(selector);
        for(var i=0; i<allElements.length; i++) {
            var el = allElements[i];
            el.parentNode.removeChild(el);
        }
    }

    // Used for hiding and showing the header when you CLEAR or RESTART the story respectively.
    function setVisible(selector, visible)
    {
        var allElements = storyContainer.querySelectorAll(selector);
        for(var i=0; i<allElements.length; i++) {
            var el = allElements[i];
            if( !visible )
                el.classList.add("invisible");
            else
                el.classList.remove("invisible");
        }
    }

    // Helper for parsing out tags of the form:
    //  # PROPERTY: value
    // e.g. IMAGE: source path
    function splitPropertyTag(tag) {
        var propertySplitIdx = tag.indexOf(":");
        if( propertySplitIdx != null ) {
            var property = tag.substr(0, propertySplitIdx).trim();
            var val = tag.substr(propertySplitIdx+1).trim();
            return {
                property: property,
                val: val
            };
        }

        return null;
    }
	//Loads Spell Tab if ahs spells

	
    // Loads save state if exists in the browser memory
    function loadSavePoint() {

        try {
            let savedState = window.localStorage.getItem('save-state');
            if (savedState) {
                story.state.LoadJson(savedState);
                return true;
            }
        } catch (e) {
            console.debug("Couldn't load save state");
        }
        return false;
    }

    // Detects which theme (light or dark) to use
    function setupTheme(globalTagTheme) {

        // load theme from browser memory
        var savedTheme;
        try {
            savedTheme = window.localStorage.getItem('theme');
        } catch (e) {
            console.debug("Couldn't load saved theme");
        }

        // Check whether the OS/browser is configured for dark mode
        var browserDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (savedTheme === "dark"
            || (savedTheme == undefined && globalTagTheme === "dark")
            || (savedTheme == undefined && globalTagTheme == undefined && browserDark))
            document.body.classList.add("dark");
    }

    // Used to hook up the functionality for global functionality buttons
    function setupButtons(hasSave) {

        let rewindEl = document.getElementById("rewind");
        if (rewindEl) rewindEl.addEventListener("click", function(event) {
            removeAll("p");
			removeAll("li");
			removeAll('h2');
			removeAll('.shop-header');
            removeAll("#story img");
			removeAll(".choice");
			
            setVisible(".header", false);
            restart();
			removeItemFromInventory(wings);
			removeItemFromInventory(magic);
			unequipItem(magic);
			unequipItem(wings);
			equipItem(hooves)
			
			
        });



        let themeSwitchEl = document.getElementById("theme-switch");
        if (themeSwitchEl) themeSwitchEl.addEventListener("click", function(event) {
            document.body.classList.add("switched");
            document.body.classList.toggle("dark");
        });

	
	let currentSlotIndex = 0;
	let dummySlotClicked = localStorage.getItem('dummySlotClicked') === 'true' || false;
	let savedSlots = JSON.parse(window.localStorage.getItem('save-slots')) || [];
	let selectedSaveIndex = null;
    const saveSlotsContainer = document.getElementById("saveSlotsContainer");
    const saveButton = document.getElementById("saveButton");
    const loadButton = document.getElementById("loadButton");
	const deleteSelectedSaves = document.getElementById("deletebutton");
	const saveSlotsContainerLoad = document.getElementById("saveSlotsContainerLoad");
    saveButton.addEventListener("click", function() {
        // Replace 0 with the desired slot index
      if (selectedSaveIndex !== null) {
    const savingToNewSlot = selectedSaveIndex !== currentSlotIndex;
    saveGameSlot(selectedSaveIndex);
    if (savingToNewSlot) {
		removeNullFromArray(savedSlots);
        dummySlotClicked = false;
        localStorage.setItem('currentSlotIndex', currentSlotIndex);
        localStorage.setItem('dummySlotClicked', dummySlotClicked);
    }

    renderSaveSlots();

    }
    });

    loadButton.addEventListener("click", function() {
        // Replace 0 with the desired slot index
		if (selectedSaveIndex !== null){
        loadSaveSlot(selectedSaveIndex);
		hideAllPages();
		page1.classList.add("show");
		document.querySelector('.outerContainer').style.overflowY = 'auto';
		}
    });
deleteSelectedSaves.addEventListener("click", function() {
         if (selectedSaveIndex !== null) {
		let savedSlots = JSON.parse(window.localStorage.getItem('save-slots')) || [];
        console.log("Before deletion:", savedSlots);

        // Create a new array excluding the selected save
        const updatedSlots = savedSlots.filter((_, index) => index !== selectedSaveIndex);

        console.log("After deletion:", updatedSlots);

        // Update localStorage with the modified array
        window.localStorage.setItem('save-slots', JSON.stringify(updatedSlots));

        // Update savedSlots with the modified array
        savedSlots = updatedSlots;

        // Reset currentSlotIndex if needed
       currentSlotIndex = Math.max(currentSlotIndex - 1, 0);

        // Clear the selected save index
        selectedSaveIndex = null;

        // Render the updated save slots only if there are remaining saves
        renderSaveSlots();
    }
    localStorage.setItem('currentSlotIndex', currentSlotIndex);
});


    // Function to render save slots
function renderSaveSlots() {
    saveSlotsContainer.innerHTML = ""; // Clear previous slots
    let savedSlots = JSON.parse(window.localStorage.getItem('save-slots')) || [];

// Add a dummy slot
   const dummySaveSlot = document.createElement("div");
    dummySaveSlot.classList.add("save-slot");
    const dummySaveInfo = document.createElement("div");
    dummySaveInfo.classList.add("save-info");
    const dummyParagraph = document.createElement("p");
    dummyParagraph.textContent = "NEW SAVE";
    dummySaveInfo.appendChild(dummyParagraph);
    dummySaveSlot.appendChild(dummySaveInfo);
let dummySlotClicked = false;

dummySaveSlot.addEventListener("click", () => {
    // Handle the click event for the dummy slot only if it hasn't been clicked before
	
    if (!dummySlotClicked) {
		selectedSaveIndex = currentSlotIndex;
        dummySlotClicked = true;	
        // Increment currentSlotIndex so that the next save will be in a new slot
		currentSlotIndex++;
		// Store values in localStorage
        localStorage.setItem('currentSlotIndex', currentSlotIndex);
        localStorage.setItem('dummySlotClicked', dummySlotClicked);
		
    }
    });
    saveSlotsContainer.appendChild(dummySaveSlot);

console.log("Saved slots:", savedSlots);
 savedSlots.forEach((save, index) => {
const saveSlot = document.createElement("div");
saveSlot.classList.add("save-slot");


const saveInfo = document.createElement("div");
saveInfo.classList.add("save-info");

const slotParagraph = document.createElement("p");
slotParagraph.textContent = `Slot: ${index + 1}`;

const levelParagraph = document.createElement("p");
levelParagraph.textContent = `Level: ${save.currentLevel}`;
levelParagraph.classList.add("level"); // Add a class for styling

const locationParagraph = document.createElement("p");
locationParagraph.textContent = `Location: ${save.currentLocation}`;
locationParagraph.classList.add("location"); // Add a class for styling
let saveSlots = document.querySelectorAll('.save-slot');

// Function to remove the 'selectedSlot' class from all saveSlots
function clearSelectedSlots() {
    saveSlots.forEach(slot => {
        slot.classList.remove('selectedSlot');
    });
}
// Append the paragraphs to the save-info div
		saveInfo.appendChild(slotParagraph);
		saveInfo.appendChild(levelParagraph);
		saveInfo.appendChild(locationParagraph);
        // Add click event to load the selected save
        saveSlot.addEventListener("click", () => {
			 clearSelectedSlots();
			 console.log("Clicked saveSlot at index:", index);
             selectedSaveIndex = index;
			 saveSlot.classList.add('selectedSlot');
			 if(dummySlotClicked){
			 dummySlotClicked = false;
			 currentSlotIndex -= 1
			 }
        });
		saveSlot.appendChild(saveInfo);

        saveSlotsContainer.appendChild(saveSlot);
    });
}



    // Function to save the game into a specific slot
	
function saveGameSlot(currentSlotIndex) {
    try {
        let savedSlots = JSON.parse(window.localStorage.getItem('save-slots')) || [];
        let currentState = story.state.toJson();
        console.log("Selected paragraphs and images:", document.querySelectorAll('#story p, #story img'));
        let elementsData = [];
		let inventoryData =JSON.stringify(inventory)

        document.querySelectorAll('#story p, #story img').forEach((element, index) => {
            if (element.tagName === 'P') {
                console.log(`Content of paragraph ${index + 1}:`, element.textContent);
                elementsData.push({ type: 'paragraph', content: element.textContent });
            } else if (element.tagName === 'IMG') {
                console.log(`Source of image ${index + 1}:`, element.src);
                elementsData.push({ type: 'image', source: element.src });
            }
        });

        console.log("Saved elements data:", elementsData);
        // Save paragraph content and image sources in your savedSlots or any other data structure
        savedSlots[currentSlotIndex] = {
            state: currentState,
            elements: elementsData,
            currentLevel: currentLevel,
            currentLocation: currentLocation,
			inventory: inventoryData
        };

        window.localStorage.setItem('save-slots', JSON.stringify(savedSlots));
        console.log(`Game saved to Slot ${currentSlotIndex + 1}`);
    } catch (e) {
        console.error("Couldn't save game state", e);
    }
}


    // Function to load the game from a specific save slot
function loadSaveSlot(currentSlotIndex) {
    try {
        let savedSlots = JSON.parse(window.localStorage.getItem('save-slots')) || [];

        if (currentSlotIndex >= 0 && currentSlotIndex < savedSlots.length) {
            let savedData = savedSlots[currentSlotIndex];

            if (savedData && savedData.elements) { // Ensure 'elements' property is defined
                let savedState = savedData.state;
                let elementsData = savedData.elements;
				let inventoryData = savedData.inventory

                // Log the loaded state and elements data for debugging
                console.log("Loaded state:", savedState);
                console.log("Loaded elements data:", elementsData);
				 console.log("Loaded inventory data:", inventoryData);
				 
                // Restore the state and create new elements within the 'story' div
				let imageContainer = document.getElementById("story");
                story.state.LoadJson(savedState);
                removeAll("p");
				imageContainer.querySelectorAll("img").forEach(img => img.remove());
                removeAll(".choice");
                recreateElements(elementsData);
				
				  // Load the inventory data
                inventory = JSON.parse(inventoryData);

                // Assuming you have a function to update the inventory UI
                updateInventoryUI();

                // Assuming you have a function to continue the story
                continueStory(true);

                console.log(`Loaded game from Save Slot ${currentSlotIndex + 1}`);
            } else {
                console.error(`Invalid save data structure in slot ${currentSlotIndex}`);
            }
        } else {
            console.error(`Invalid save slot index: ${currentSlotIndex}`);
        }
    } catch (e) {
        console.error("Couldn't load save state", e);
    }
}

// Function to create new <p> elements based on saved content
function recreateElements(elementsData) {
    elementsData.forEach((elementData) => {
        if (elementData.type === 'paragraph') {
            // Create and append new <p> elements
            createParagraph(elementData.content);
        } else if (elementData.type === 'image') {
            // Create and append new <img> elements
            createImage(elementData.source);
        }
        // Add logic for other types if needed
    });
}

// Example function to create a new paragraph element
function createParagraph(content) {
    let paragraph = document.createElement("p");
    paragraph.textContent = content;
    document.getElementById("story").appendChild(paragraph);
}

// Example function to create a new image element
function createImage(source) {
    let image = document.createElement("img");
    image.src = source;
    document.getElementById("story").appendChild(image);
}

// Example function to remove elements by selector
function removeAll(selector) {
    let elements = document.querySelectorAll(selector);
    elements.forEach((element) => element.remove());
}

	
	// Get references to the buttons using their IDs
	var btnShowPage1 = document.getElementById("scenetab");
	var btnShowPage2 = document.getElementById("statstab");
	var btnShowPage3 = document.getElementById("statustab");
	var btnShowPage4 = document.getElementById("inventorytab");
	var btnShowPage5 = document.getElementById("spellstab");
	var btnShowPage6 = document.getElementById("savetab");
	var btnShowPage7 = document.getElementById("formtab");


	// Get references to the page div elements using their IDs
	var page1 = document.getElementById("story");
	var page2 = document.getElementById("stats");
	var page3 = document.getElementById("status");
	var page4 = document.getElementById("inventory");
	var page5 = document.getElementById("spells");
	var page6 = document.getElementById("save");
	var page7 = document.getElementById("forms");



	// Define event listeners and their corresponding actions
	btnShowPage1.addEventListener("click", function() {
	hideAllPages();
	page1.classList.add("show");
	document.querySelector('.outerContainer').style.overflowY = 'auto';
	});

	btnShowPage2.addEventListener("click", function() {
	hideAllPages();
	document.querySelector('.outerContainer').scrollTop = 0;
	page2.classList.add("show");
	});

	btnShowPage3.addEventListener("click", function() {
	hideAllPages();
	document.querySelector('.outerContainer').scrollTop = 0;
	page3.classList.add("show");
	})
	btnShowPage4.addEventListener("click", function() {
	hideAllPages();
	document.querySelector('.outerContainer').scrollTop = 0;
	page4.classList.add("show");
	});

	btnShowPage5.addEventListener("click", function() {
	hideAllPages();
	document.querySelector('.outerContainer').scrollTop = 0;
	page5.classList.add("show");
	});

	btnShowPage6.addEventListener("click", function() {
	hideAllPages();
	renderSaveSlots();
	document.querySelector('.outerContainer').scrollTop = 0;
	page6.classList.add("show");

	});


	btnShowPage7.addEventListener("click", function() {
	hideAllPages();
	document.querySelector('.outerContainer').scrollTop = 0;
	page7.classList.add("show");
	showCorrectContainer();
	});
	
  


//Remove Null saves
function removeNullFromArray(savedSlots) {
    // Get the count of slots with null or undefined state before filtering
    const nullStateRemovedCount = savedSlots.filter(slot => slot.state === null || slot.state === undefined).length;

    // Use filter to create a new array without slots with null or undefined state
    savedSlots = savedSlots.filter(slot => slot.state !== null && slot.state !== undefined);

    // Save the updated array to localStorage

    // Additional actions after removing slots with null or undefined state
    renderSaveSlots();
    currentSlotIndex = Math.max(0, currentSlotIndex - nullStateRemovedCount);
}
	// Function to hide all page div elements
	function hideAllPages() {
	page1.classList.remove("show");
	page2.classList.remove("show");
	page3.classList.remove("show");
	page4.classList.remove("show");
	page5.classList.remove("show");
	page6.classList.remove("show");
	page7.classList.remove("show");
	document.querySelector('.outerContainer').style.overflowX = 'hidden';
	document.querySelector('.outerContainer').style.overflowY = 'hidden';
	ponyContainer.classList.remove("show");
    zebraContainer.classList.remove("show");
	};
	//Form page
	
	
function showCorrectContainer() {
    // Check if page 7 is active
    if (page7.classList.contains("show")) {
        // Get all buttons with class "button" in an array
        const buttons = document.querySelectorAll('.button');

        // Loop through each button to check if any are highlighted
        buttons.forEach(button => {
            if (button.classList.contains("highlight")) {
                // If a highlighted button is found, show the corresponding container
                if (button.id === "ponybutton") {
                    ponyContainer.classList.add("show");
                } else if (button.id === "zebrabutton") {
                    zebraContainer.classList.add("show");
                }
            }
        });
    }
}

	
	
	function hideAllImagesAndButtons() {
    const allContainers = document.querySelectorAll('.image-container');

    allContainers.forEach(container => {
        container.classList.remove('show'); // Remove the show class from all containers

        // Remove show class from each image in the specified container
        const images = container.querySelectorAll('.fade-in-out');
        images.forEach(image => {
            image.classList.remove('show');
        });

        // Remove show class from each button in the specified container
        const buttons = container.querySelectorAll('.chooseButton');
        buttons.forEach(button => {
            button.classList.remove('show');
        });
    });
}



function showImages(containerId) {
    const container = document.getElementById(containerId);

    if (container) {
        container.classList.add('show'); // Add the show class to the container

        // Add show class to each image in the specified container
        const images = container.querySelectorAll('.fade-in-out');
        images.forEach(image => {
            image.classList.add('show');
        });

        // Add show class to each button in the specified container
        const buttons = container.querySelectorAll('.chooseButton');
        buttons.forEach(button => {
            button.classList.add('show');
        });
    } else {
        console.error('Container not found:', containerId);
    }
}

	// Stats
		story.ObserveVariable("strength", function(variableName, variableValue) {
			document.getElementById("StrengthNum").innerText = variableValue
			if (variableValue === 1) {document.getElementById("StrengthComment").innerText = "Morbidly Weak."}
			else if (variableValue < 3) {document.getElementById("StrengthComment").innerText = "Watch out for strong winds."}
			else if (variableValue < 5) {document.getElementById("StrengthComment").innerText = "Visibly weak."}
			else if (variableValue < 7 ){document.getElementById("StrengthComment").innerText = "Not the strongest."}
			else if (variableValue < 9 ){document.getElementById("StrengthComment").innerText = "Can make one cart trip."}
			else if (variableValue < 11 ){document.getElementById("StrengthComment").innerText = "Average."}
			else if (variableValue < 13 ){document.getElementById("StrengthComment").innerText= "Strong."}
			else if (variableValue < 15 ){document.getElementById("StrengthComment").innerText = "Visibly toned."}
			else if (variableValue < 17 ){document.getElementById("StrengthComment").innerText = "Muscular."}
			else if (variableValue < 19 ){document.getElementById("StrengthComment").innerText = "Heavily Muscular"}
			else if (variableValue === 20 ){document.getElementById("StrengthComment").innerText = "Pinnacle of brawn"}

			});
		story.ObserveVariable("dexterity", function(variableName, variableValue){
			document.getElementById("DexterityNum").innerText = variableValue
		if (variableValue === 1) {document.getElementById("DexterityComment").innerText = "Barely Mobile."}
			else if (variableValue < 3) {document.getElementById("DexterityComment").innerText = "Painful Movement."}
			else if (variableValue < 5) {document.getElementById("DexterityComment").innerText = "Difficulty Moving."}
			else if (variableValue < 7 ){document.getElementById("DexterityComment").innerText = "Total Klutz."}
			else if (variableValue < 9 ){document.getElementById("DexterityComment").innerText = "Somewhat Slow."}
			else if (variableValue < 11 ){document.getElementById("DexterityComment").innerText = "Average."}
			else if (variableValue < 13 ){document.getElementById("DexterityComment").innerText= "Quick."}
			else if (variableValue < 15 ){document.getElementById("DexterityComment").innerText = "Nimble."}
			else if (variableValue < 17 ){document.getElementById("DexterityComment").innerText = "Light on your feet."}
			else if (variableValue < 19 ){document.getElementById("DexterityComment").innerText = "Graceful"}
			else if (variableValue === 20 ){document.getElementById("DexterityComment").innerText = "Swift as a River"}
		});
		story.ObserveVariable("constitution", function(variableName, variableValue){
			document.getElementById("ConstitutionNum").innerText = variableValue
		if (variableValue === 1) {document.getElementById("ConstitutionComment").innerText = "Anemic."}
			else if (variableValue < 3) {document.getElementById("ConstitutionComment").innerText = "Frail."}
			else if (variableValue < 5) {document.getElementById("ConstitutionComment").innerText = "Brusied by a touch."}
			else if (variableValue < 7 ){document.getElementById("ConstitutionComment").innerText = "Prone to Illness."}
			else if (variableValue < 9 ){document.getElementById("ConstitutionComment").innerText = "Easily Winded."}
			else if (variableValue < 11 ){document.getElementById("ConstitutionComment").innerText = "Average."}
			else if (variableValue < 13 ){document.getElementById("ConstitutionComment").innerText= "Fortified."}
			else if (variableValue < 15 ){document.getElementById("ConstitutionComment").innerText = "Peak Physique"}
			else if (variableValue < 17 ){document.getElementById("ConstitutionComment").innerText = "Perfect Vitality."}
			else if (variableValue < 19 ){document.getElementById("ConstitutionComment").innerText = "Never wears down."}
			else if (variableValue === 20 ){document.getElementById("ConstitutionComment").innerText = "I can do this all day."}
		});
		story.ObserveVariable("intelligence", function(variableName, variableValue){
			document.getElementById("IntelligenceNum").innerText = variableValue
		if (variableValue === 1) {document.getElementById("IntelligenceComment").innerText = "Animalistic."}
			else if (variableValue < 3) {document.getElementById("IntelligenceComment").innerText = "Rather Animalistic."}
			else if (variableValue < 5) {document.getElementById("IntelligenceComment").innerText = "Limited Knowledge."}
			else if (variableValue < 7 ){document.getElementById("IntelligenceComment").innerText = "Complete Ditz."}
			else if (variableValue < 9 ){document.getElementById("IntelligenceComment").innerText = "Forgetful"}
			else if (variableValue < 11 ){document.getElementById("IntelligenceComment").innerText = "Average."}
			else if (variableValue < 13 ){document.getElementById("IntelligenceComment").innerText= "Logical"}
			else if (variableValue < 15 ){document.getElementById("IntelligenceComment").innerText = "Fairly Intelligent"}
			else if (variableValue < 17 ){document.getElementById("IntelligenceComment").innerText = "Very Intelligent."}
			else if (variableValue < 19 ){document.getElementById("IntelligenceComment").innerText = "Smartest in the Room"}		
			else if (variableValue === 20 ){document.getElementById("IntelligenceComment").innerText = "Famous Genius"}
		});
		story.ObserveVariable("wisdom", function(variableName, variableValue){
			document.getElementById("WisdomNum").innerText = variableValue
		if (variableValue === 1) {document.getElementById("WisdomComment").innerText = "Barely Aware."}
			else if (variableValue < 3) {document.getElementById("WisdomComment").innerText = "Oblivious"}
			else if (variableValue < 5) {document.getElementById("WisdomComment").innerText = "No Forethought"}
			else if (variableValue < 7 ){document.getElementById("WisdomComment").innerText = "No Common Sense"}
			else if (variableValue < 9 ){document.getElementById("WisdomComment").innerText = "Unaware"}
			else if (variableValue < 11 ){document.getElementById("WisdomComment").innerText = "Average."}
			else if (variableValue < 13 ){document.getElementById("WisdomComment").innerText= "Insightful."}
			else if (variableValue < 15 ){document.getElementById("WisdomComment").innerText = "Intuitive."}
			else if (variableValue < 17 ){document.getElementById("WisdomComment").innerText = "Amazingly Perceptive."}
			else if (variableValue < 19 ){document.getElementById("WisdomComment").innerText = "Source of Wisdom"}
			else if (variableValue === 20 ){document.getElementById("WisdomComment").innerText = "Nearly Prescient"}
		
		});
		story.ObserveVariable("charisma", function(variableName, variableValue){
			document.getElementById("CharismaNum").innerText = variableValue
		if (variableValue === 1) {document.getElementById("CharismaComment").innerText = "Repelling Presence."}
			else if (variableValue < 3) {document.getElementById("CharismaComment").innerText = "Minimal Thought"}
			else if (variableValue < 5) {document.getElementById("CharismaComment").innerText = "Unsociable"}
			else if (variableValue < 7 ){document.getElementById("CharismaComment").innerText = "Uninteresting"}
			else if (variableValue < 9 ){document.getElementById("CharismaComment").innerText = "Kinda a Bore"}
			else if (variableValue < 11 ){document.getElementById("CharismaComment").innerText = "Average."}
			else if (variableValue < 13 ){document.getElementById("CharismaComment").innerText= "Mildy Interesting."}
			else if (variableValue < 15 ){document.getElementById("CharismaComment").innerText = "Popular."}
			else if (variableValue < 17 ){document.getElementById("CharismaComment").innerText = "Quite Eloquent."}
			else if (variableValue < 19 ){document.getElementById("CharismaComment").innerText = "Everyone's Friend"}
			else if (variableValue === 20 ){document.getElementById("CharismaComment").innerText = "Renowned"}
		});
		

	//Status Bars
		
		

		story.ObserveVariable("health", function(variableName, newValue) {
			currentHp = newValue;	
			document.getElementById("healthNum").innerText = currentHp + " / "+ maxHp;
			const healthPercent = percent(currentHp,maxHp);
			document.getElementById("healthBar").style.width = `${healthPercent}%`;
		});
		story.ObserveVariable("maxHealth", function(variableName, newValue) {
			maxHp = newValue;
		});
		
		story.ObserveVariable("will", function(variableName, newValue) {
			will = newValue;	
			document.getElementById("willNum").innerText = will + " / "+ maxWill;
			const willPercent = percent(will,maxWill);
			document.getElementById("willBar").style.width = `${willPercent}%`;
		});
		story.ObserveVariable("maxWill", function(variableName, newValue) {
			maxWill = newValue;
		});
		
		story.ObserveVariable("lust", function(variableName, newValue) {
			lust = newValue;
			document.getElementById("libidoNum").innerText = lust + " / "+ maxLust;
			const lustPercent = percent(lust,maxLust);
			document.getElementById("libidoBar").style.width = `${lustPercent}%`;
		});
		story.ObserveVariable("maxWill", function(variableName, newValue) {
			maxWill = newValue;
		});
		
		
		
		story.ObserveVariable("xp", function(variableName, newValue) {
			currentXp = newValue;
			document.getElementById("xpNum").innerText = currentXp + " / "+ needXp;
			const xpPercent = percent(currentXp,needXp);
			document.getElementById("xpBar").style.width = `${xpPercent}%`;
			});
		story.ObserveVariable("needxp", function(variableName, newValue) {
			needXp = newValue;
			});
			
	document.getElementById('volumeButton').addEventListener('click', function() {
    var slider = document.getElementById('volumeSlider');
    slider.style.display = slider.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('creditsbutton').addEventListener('click', function() {
	audio.pause();
});
	document.getElementById('volumeSlider').addEventListener('input', function(e) {
    var volume = e.target.value;
    document.getElementById('myAudio').volume = volume;
    console.log("Volume set to: " + volume);
});
   var isImageOne = true;
	document.getElementById('myAudio').volume = 0.15; // 50% volume
    document.getElementById('playButton').addEventListener('click', function() {
		var audio = document.getElementById('myAudio')
		  if (audio.paused) {
            audio.play();
        } else {
            audio.pause(); // Optional: Restart the song if already playing
        }
        if (isImageOne) {
            document.getElementById('buttonImage').src = 'IMAGE/Icon/Pause Button.gif';
        } else {
            document.getElementById('buttonImage').src = 'IMAGE/Icon/Play Button.gif';
        }
	
        isImageOne = !isImageOne; // Toggle the flag
    });

story.ObserveVariable("level", function(variableName, newValue) {
			currentLevel = newValue;	
		});
story.ObserveVariable("location", function(variableName, newValue) {
			currentLocation = newValue;	
		});
story.ObserveVariable("lust", function(variableName, newValue) {
			lust = newValue;	
		});
story.ObserveVariable("will", function(variableName, newValue) {
			will = newValue;	
		});
	

story.BindExternalFunction("willHarm", (x) => {
    will -= Math.round(x * ((lust / 100) + 1));
	
	if (will < 0) {
        will = 0;
    }
	story.variablesState["will"] = will

});

//Enemy Combat Stats
		let enemyCurrentWill = 0;
		let enemyCurrentLust =0;

story.ObserveVariable("enemyCurrentLust", function(variableName, newValue) {
			enemyCurrentLust = newValue;	
		});
story.ObserveVariable("enemyCurrentWill", function(variableName, newValue) {
			enemyCurrentWill = newValue;	
		});

	    story.ObserveVariable("enemyCurrentHP", function(variableName, newValue) {
			enemyCurrentHP = newValue;	
		});

story.ObserveVariable("Attack_Mod", function(variableName, newValue) {
			Attack_Mod = newValue;	
		});	    
		
 
		
story.BindExternalFunction("enemywillHarm", (x) => {
       enemyCurrentWill -= Math.round(x * ((enemyCurrentLust / 100) + 1));
   if (enemyCurrentWill < 0) {
        enemyCurrentWill = 0; 
    }
	story.variablesState["enemyCurrentWill"] = enemyCurrentWill

});




  let currency = story.variablesState["bits"] 
// Example usage
const sword = createItem('Sword', 'Deals slashing damage', 1, 'sword.png', true, false, false,  '1d6');
const shield = createItem('Shield', 'Provides additional defense', 1, 'IMAGE/Items/Shield/tile091.png', true);
const minorhealthPotion = createItem('Minor Health Potion', 'Restores a little bit of health', 1, 'IMAGE/Items/Potions/tile016.png', false, true);
const javelin = createItem('Javelin', 'Deals pieceing damage', 1, 'sword.png', true, '1d6');
const hooves = createItem('Hooves', 'Your goddess given right', 1, 'IMAGE/Items/Weapons/tile131.png', true, false, false, '1d4');
const wings = createItem('Wings', 'You use these to fly', 1, 'IMAGE/Items/Weapons/wing.png', true, false, false, '1d4');
const magic = createItem('Magic', 'Power from the Unknown', 1, 'IMAGE/Items/Weapons/562.png', true, false, false, '1d4');
const bits = createItem('Bits', 'The main form of currency', 1, 'IMAGE/Items/Treasure/8.png', false);

addItemToInventory(hooves);
equipItem(hooves);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
addItemToInventory(bits);
// Function to parse and calculate damage based on the provided damage object

story.ObserveVariable("hasWings", function(variableName, newValue) {
			hasWings = newValue;
			addItemToInventory(wings);
			
		});	   

story.ObserveVariable("unicorn", function(variableName, newValue) {
			unicorn = newValue;
			addItemToInventory(magic);
			unequipItem(hooves)
			equipItem(magic);
		});	 
  

story.BindExternalFunction("enemyHarm", (x) => {
	const damageAmount = calculateDamage(currentItem.damage);
  if (x < 0) {
    // Calculate damage based on currentItem.damage
    const damageAmount = calculateDamage('+1');
    enemyCurrentHP = enemyCurrentHP - damageAmount + Attack_Mod;
  } else {
    enemyCurrentHP = enemyCurrentHP - calculateDamage(currentItem.damage) + Attack_Mod;
  }
console.log(`You delt ${damageAmount+Attack_Mod} damage.`);
  if (enemyCurrentHP < 0) {
    enemyCurrentHP = 0;
  }

  story.variablesState["enemyCurrentHP"] = enemyCurrentHP;
});
//SHOP
// Define different NPC sellers and their shop inventories

const npcSellers = {
    'Citrus': { 
	inventory: [
	createItem('Orange', 'Restores a little bit of health', 5, 'IMAGE/Items/Food/tile103.png', false, false, false, '0', 5),
	createItem('Orange Juice', 'Restores  bit of health', 5, 'IMAGE/Items/Food/tile212.png', false, false, false, '0', 20)
	] 
	}, // Add blacksmith's inventory
    'Thyme': {
		inventory: [
		
		] 
		}, // Add alchemist's inventory
    // Add more sellers as needed
};

// Function to display items in the shop and append them to the storyContainer



story.ObserveVariable("bits", function(variableName, newValue) {
  const bitsItem = inventory.find(item => item.name === 'Bits');
  const quantityChange = newValue - (bitsItem?.quantity || 0); // Handles initial case where bitsItem is null

  if (quantityChange > 0) {
    // Bits increased, update quantity
    bitsItem.quantity = newValue;
  } else if (quantityChange < 0) {
    // Bits decreased, remove some from inventory
    const amountToRemove = Math.abs(quantityChange);
   if (bitsItem) {
  bitsItem.quantity = Math.max(bitsItem.quantity - amountToRemove, 0);
  //  Ensure quantity doesn't go below 0
  if (bitsItem.quantity === 0) {
    const indexToRemove = inventory.indexOf(bitsItem);
    inventory.splice(indexToRemove, 1);
  }
}
  }
  updateInventoryUI();
});

 const ponyContainer = document.getElementById('ponyContainer');
 const zebraContainer = document.getElementById('zebraContainer');
 const ponyButton = document.getElementById('ponybutton');
 const zebraButton = document.getElementById('zebrabutton');
 
	 ponyButton.addEventListener('click', function() {
		// Toggle visibility of form options
		this.classList.add('highlight');
		zebraButton.classList.remove('highlight')
		ponyContainer.classList.add("show");
		zebraContainer.classList.remove("show");
	  });
	  zebraButton.addEventListener('click', function() {
		// Toggle visibility of form options
		this.classList.add('highlight');
        ponyButton.classList.remove('highlight');
		ponyContainer.classList.remove("show");
		zebraContainer.classList.add("show");
	  });
	  


}})(storyContent);
