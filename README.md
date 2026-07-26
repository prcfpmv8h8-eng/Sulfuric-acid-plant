# שלב נתונים 2 – כרטיס ציוד מלא ותמונות

נוספה אפשרות לפתוח כל יחידת ציוד ולקבל מסך פרטים מלא.

## שדות חדשים ב-equipment.json

- `location` – מיקום בשטח
- `operation` – אופן הפעלה
- `commonFaults` – תקלות נפוצות
- `safety` – מידע בטיחותי
- `additionalInfo` – מידע נוסף
- `image` – נתיב לתמונה

## הוספת תמונה ליחידת ציוד

1. העלה את התמונה לתיקייה `images` ב-GitHub.
2. מומלץ לתת שם באנגלית ללא רווחים, לדוגמה:
   `P1-446A.jpg`
3. ברשומת הציוד בתוך `equipment.json` הזן:
   `"image": "images/P1-446A.jpg"`

כאשר אין תמונה, האתר מציג תמונת ברירת מחדל.

## קבצים להעלאה/החלפה

- `index.html`
- `style.css`
- `script.js`
- `equipment.json`
- תיקיית `images` ובתוכה `placeholder.svg`
