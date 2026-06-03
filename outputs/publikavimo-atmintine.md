# Publikavimo atmintinė

Projektas yra Vite statinė SPA aplikacija.

Rekomenduojamas būdas: Vercel arba Netlify. Paprasčiausia naudoti Vercel, jei projektą įkelsite į GitHub.

## Vercel nustatymai

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Environment variables:

```text
VITE_SUPABASE_URL=https://npsmcpjnxuvhayyohoul.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_A1MIXE8gV2aKww0s6RNchQ_fUqMf1Fe
```

Kur įvesti:

```text
Vercel -> Project -> Settings -> Environment Variables
```

## Supabase Auth nustatymai

Kai gausite publikuotos svetainės adresą, pridėkite jį Supabase:

```text
Supabase -> Authentication -> URL Configuration
```

Site URL:

```text
https://jusu-svetaines-adresas
```

Redirect URLs:

```text
https://jusu-svetaines-adresas/**
```

## Patikrinimas po publikavimo

1. Atidarykite svetainę iš kito kompiuterio arba telefono.
2. Prisijunkite su Supabase Authentication vartotoju.
3. Patikrinkite, ar matosi prekės, tiekėjai ir pajamavimo dokumentai.
4. Sukurkite juodraštį ir įsitikinkite, kad likutis nesikeičia.
5. Patvirtinkite dokumentą ir įsitikinkite, kad likutis padidėja.
6. Patikrinkite likučių istoriją.
7. Atsijunkite ir įsitikinkite, kad inventoriaus puslapiai paslepiami.
