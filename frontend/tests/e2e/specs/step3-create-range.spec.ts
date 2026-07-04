/**
 * ÉTAPE 3: Test pour créer une range
 * 
 * Objectif: Créer une range et vérifier qu'elle est enregistrée.
 * 
 * NOTE: D'après les erreurs, le bouton "Nouvelle Range" ouvre un DIALOGUE
 * (pas une nouvelle page), et les champs n'utilisent pas name="name".
 * 
 * À exécuter localement avec:
 *   npm run start (dans un terminal)
 *   npx playwright test --headed tests/e2e/specs/step3-create-range.spec.ts (dans un autre terminal)
 */

import { test, expect } from '@playwright/test';

test.describe('Étape 3: Créer une range', () => {
  
  test('Ouvrir le dialogue de création de range', async ({ page }) => {
    // 1. Aller sur la page /ranges
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    // 2. Cliquer sur "Nouvelle Range" - cela ouvre un dialogue
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.waitFor({ state: 'visible', timeout: 10000 });
    await newRangeButton.click();
    
    // 3. Attendre que le dialogue s'ouvre (Material-UI Dialog)
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 4. Vérifier que le titre du dialogue est correct
    const dialogTitle = page.locator('.MuiDialogTitle-root');
    await expect(dialogTitle).toBeVisible();
    
    // Afficher le titre pour débogage
    const titleText = await dialogTitle.textContent();
    console.log(`Dialog title: "${titleText}"`);
  });
  
  test('Remplir le formulaire dans le dialogue', async ({ page }) => {
    // 1. Ouvrir le dialogue
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 2. Trouver le champ de nom - essayer plusieurs sélecteurs Material-UI
    // Possibilités dans ton code :
    // - TextField avec label="Nom" ou label="Name"
    // - input avec id="name" ou id="rangeName"
    // - .MuiInput-root input
    
    // Essayons d'abord par label
    const nameInputByLabel = page.locator('.MuiTextField-root:has-text("Nom") input');
    const nameInputById = page.locator('input#name');
    const nameInputByClass = page.locator('.MuiInput-root input').first();
    
    let nameInput;
    
    if (await nameInputByLabel.count() > 0) {
      nameInput = nameInputByLabel;
      console.log('Using name input by label');
    } else if (await nameInputById.count() > 0) {
      nameInput = nameInputById;
      console.log('Using name input by id');
    } else if (await nameInputByClass.count() > 0) {
      nameInput = nameInputByClass;
      console.log('Using name input by class');
    } else {
      // Afficher tous les inputs pour débogage
      const allInputs = page.locator('input');
      const inputCount = await allInputs.count();
      console.log(`Found ${inputCount} inputs total`);
      
      // Essayer de trouver par type
      const textInputs = page.locator('input[type="text"]');
      const textInputCount = await textInputs.count();
      console.log(`Found ${textInputCount} text inputs`);
      
      throw new Error('Could not find name input. Check console logs for available inputs.');
    }
    
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Ma Première Range E2E');
    
    // 3. Vérifier que le champ est rempli
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe('Ma Première Range E2E');
  });
  
  test('Sauvegarder la range', async ({ page }) => {
    // 1. Ouvrir le dialogue et remplir le nom
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Trouver le champ name (même logique que dans le test précédent)
    const nameInputByLabel = page.locator('.MuiTextField-root:has-text("Nom") input');
    const nameInputById = page.locator('input#name');
    const nameInputByClass = page.locator('.MuiInput-root input').first();
    
    let nameInput;
    
    if (await nameInputByLabel.count() > 0) {
      nameInput = nameInputByLabel;
    } else if (await nameInputById.count() > 0) {
      nameInput = nameInputById;
    } else {
      nameInput = nameInputByClass;
    }
    
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Range E2E Test Sauvegarde');
    
    // 2. Trouver et cliquer sur le bouton Sauvegarder
    // Dans un dialogue Material-UI, le bouton est probablement :
    // - button:has-text("Sauvegarder")
    // - button:has-text("Enregistrer")
    // - button[type="submit"]
    // - .MuiButton-contained
    
    const saveButton = page.locator('button:has-text("Sauvegarder")');
    const saveButtonCount = await saveButton.count();
    
    if (saveButtonCount > 0) {
      await saveButton.waitFor({ state: 'visible', timeout: 5000 });
      await saveButton.click();
    } else {
      // Essayer d'autres variantes
      const submitButton = page.locator('button[type="submit"]');
      const submitCount = await submitButton.count();
      
      if (submitCount > 0) {
        await submitButton.click();
      } else {
        // Afficher tous les boutons pour débogage
        const allButtons = page.locator('button');
        const buttonCount = await allButtons.count();
        console.log(`Found ${buttonCount} buttons in dialog`);
        
        const buttonTexts = [];
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const btn = allButtons.nth(i);
          const text = await btn.textContent();
          buttonTexts.push(`Button ${i}: "${text}"`);
        }
        console.log(buttonTexts.join('\n'));
        
        throw new Error('Could not find save button. Check console logs for available buttons.');
      }
    }
    
    // 3. Attendre que le dialogue se ferme
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // 4. Vérifier qu'on est toujours sur /ranges
    await expect(page).toHaveURL('http://localhost:3000/ranges');
  });
  
  test('Vérifier que la range apparaît dans la liste', async ({ page }) => {
    // 1. Créer une range
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Remplir le nom
    const nameInputByLabel = page.locator('.MuiTextField-root:has-text("Nom") input');
    const nameInputById = page.locator('input#name');
    const nameInputByClass = page.locator('.MuiInput-root input').first();
    
    let nameInput;
    
    if (await nameInputByLabel.count() > 0) {
      nameInput = nameInputByLabel;
    } else if (await nameInputById.count() > 0) {
      nameInput = nameInputById;
    } else {
      nameInput = nameInputByClass;
    }
    
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Range pour Test Liste');
    
    // Sauvegarder
    const saveButton = page.locator('button:has-text("Sauvegarder")');
    const saveButtonCount = await saveButton.count();
    
    if (saveButtonCount > 0) {
      await saveButton.click();
    } else {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
    }
    
    // Attendre que le dialogue se ferme
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // 2. Vérifier que la range apparaît dans la liste
    // D'après l'Étape 2, on sait qu'il y a des .MuiList-root
    // La nouvelle range devrait apparaître dans une liste
    
    const rangeName = page.locator('text="Range pour Test Liste"');
    await rangeName.waitFor({ state: 'visible', timeout: 10000 });
    
    // Si on ne trouve pas par texte exact, essayer des variantes
    const rangeNamePartial = page.locator('text=/Range pour Test/');
    const rangeNameCount = await rangeNamePartial.count();
    
    if (rangeNameCount === 0) {
      // Afficher le contenu de la page pour débogage
      const bodyText = await page.locator('body').textContent();
      console.log('Page content (first 500 chars):', bodyText?.substring(0, 500));
      
      // Essayer de trouver dans les listes
      const listItems = page.locator('.MuiListItem-root');
      const listItemCount = await listItems.count();
      console.log(`Found ${listItemCount} list items`);
      
      throw new Error('Could not find range in list. Check console logs.');
    }
    
    await expect(rangeNamePartial).toBeVisible();
  });
});
