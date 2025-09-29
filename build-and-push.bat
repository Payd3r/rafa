@echo off
setlocal enabledelayedexpansion

REM Variabili per il recap finale
set total_builds=0
set successful_builds=0
set failed_builds=0
set build_log=

echo 🚀 Build e push dell'immagine Sito Rafa su Registry Privato (192.168.0.23:5000)
echo.

REM Configurazione
set REGISTRY_URL=192.168.0.23:5000
set IMAGE_NAME=sito-rafa
set TAG=latest
set FULL_IMAGE=%REGISTRY_URL%/%IMAGE_NAME%:%TAG%

echo 📦 Building sito-rafa...
docker build -t "%FULL_IMAGE%" .
if %errorlevel% equ 0 (
    echo ✅ Sito-rafa buildato con successo
    echo 📤 Pushing sito-rafa...
    docker push "%FULL_IMAGE%"
    if %errorlevel% equ 0 (
    echo ✅ Sito-rafa pushato con successo
    echo.
    echo 🔍 Verifica dell'immagine pushato...
    echo Controllo immagini locali:
    docker images | findstr sito-rafa
    echo.
    echo Controllo disponibilità nel registry:
    curl -s http://%REGISTRY_URL%/v2/sito-rafa/tags/list
    echo.
    echo.
    echo 📋 IMMAGINE PUSHATA SU REGISTRY:
    echo - %FULL_IMAGE%
    echo.
    echo ✅ Ora vai su Portainer e fai il deploy del docker-compose.yml!
    echo.
    call :log_result success "Sito-rafa"
    ) else (
        echo ❌ Errore nel push del sito-rafa
        call :log_result error "Sito-rafa"
    )
) else (
    echo ❌ Errore nel build del sito-rafa
    call :log_result error "Sito-rafa"
)

goto :end

REM Funzione helper per registrare i risultati
:log_result
set /a total_builds+=1
if %1==success (
    set /a successful_builds+=1
    set build_log=!build_log!✅ %2 - SUCCESSO
) else (
    set /a failed_builds+=1
    set build_log=!build_log!❌ %2 - ERRORE
)
goto :eof

:end
echo.
echo ===========================================
echo 📊 RECAP FINALE BUILD E PUSH
echo ===========================================
echo.
echo 📈 Statistiche:
echo    - Total builds: %total_builds%
echo    - Successi: %successful_builds%
echo    - Errori: %failed_builds%
echo.
echo ===========================================
echo Premere un tasto per chiudere...
pause >nul
