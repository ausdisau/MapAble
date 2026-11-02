# QGIS installation and Open Buildings validation for MapAble

**Status (1 November 2026):** Installation automated in GitHub Actions **only**; no installation on the user's Windows desktop or in the ChatGPT execution container is claimed. This is a research/tooling workflow, not approval for live external data ingestion or wheelchair navigation.

## Diagnostic result in the chat execution environment

- The current model execution container runs Debian GNU/Linux **13 (trixie)** as root.
- `qgis`, `qgis_process` and QGIS Python bindings were absent.
- `apt-get update` failed to resolve `deb.debian.org` (`Temporary failure resolving`); direct `curl` requests could not resolve `storage.googleapis.com` or Debian repositories.
- No APT indexes or cached QGIS binaries were available, so installing QGIS in that restricted container was **not possible**. No attempt was made to bypass its network controls.

## Installation route A: project CI (reproducible, installed only in an ephemeral container)

`.github/workflows/qgis-toolchain-validation.yml` uses the **official** [QGIS Docker desktop image](https://hub.docker.com/r/qgis/qgis/tags) pinned to `qgis/qgis:3.44.15-trixie`. The GitHub runner pulls the image and checks:
1. `qgis_process --version`;
2. installs/links the upstream [Open Buildings Downloader](https://github.com/ColdLabs/qgis-open-buildings) at commit `808a8e412ad87fdd605194f19cea6d889b258491`;
3. `qgis_process plugins enable open_buildings_downloader`;
4. `qgis_process help openbuildings:download` including `MIN_CONFIDENCE`, `MAX_DOWNLOAD_MB`, `OUTPUT_POLYGONS` and `OUTPUT_POINTS`.

No external Google building data is requested in this verification workflow; the plugin's data-fetch action is not executed. The image is pulled afresh by CI and is **not persistently installed** in the canonical MapAble repository, a production server or on a user computer. Review the workflow's **latest head SHA** before interpreting run status. This CI setup does not imply that MapAble production is deployed or approved.

Official plugin test runner documentation: https://github.com/qgis/qgis-docker/blob/master/desktop/README.md

## Installation route B: Windows 10/11, user-controlled desktop

The recommended version as of **1 November 2026** is **QGIS 3.44.15 LTR**, which exceeds the plugin's minimum QGIS 3.38.0. The official download site also offers QGIS 4.2.3, but the LTR reduces version uncertainty for first validation.

- Official downloads: https://qgis.org/download/
- Official Open Buildings plugin: https://plugins.qgis.org/plugins/open_buildings_downloader/

Open **PowerShell/Windows Terminal** on the Windows computer and check the availability/version of WinGet:

```powershell
winget --version
winget search --id OSGeo.QGIS_LTR --exact
winget show --id OSGeo.QGIS_LTR --exact
```

If the official WinGet source lists a compatible version (3.38 or later), install QGIS **interactively** so you can review its software publisher and installer prompts:

```powershell
winget install --id OSGeo.QGIS_LTR --exact --source winget --interactive --accept-source-agreements --accept-package-agreements
```

Do **not** use `--ignore-security-hash` to bypass an installer integrity failure. If the package is missing, stale, or produces a hash error, use the verified **Windows QGIS 3.44 LTR** standalone installer from https://qgis.org/download/ instead; check the published checksum.

Then launch QGIS, open **Help → About** and confirm the version; go to **Plugins → Manage and Install Plugins**, search for **Open Buildings Downloader**, install the stable plugin and enable it. Check **Processing Toolbox → Google Open Buildings → Download buildings**. In the **OSGeo4W Shell** shipped with QGIS, the command-line equivalent is:

```cmd
qgis_process plugins enable open_buildings_downloader
qgis_process help openbuildings:download
```

If WinGet is unavailable, the official OSGeo4W online installer or the standalone MSI is the fallback. QGIS installation on Windows requires a working network connection (unless a genuine offline installer has been separately obtained), sufficient free disk, and possibly local administrator approval.

### Windows network troubleshooting (without evading controls)

Check `Resolve-DnsName qgis.org` and `Test-NetConnection qgis.org -Port 443`. A Windows network outage, enterprise firewall, proxy, permission restriction or certificate issue requires the responsible computer/network administrator to repair the connection. Never disable antivirus, TLS checking, corporate policy or checksum validation to force an installation.

## Recommended data-validation workflow after installation

1. Open the QGIS Processing Toolbox and select the Open Buildings Downloader plugin. Use a **small approved Singapore or India AOI**. The plugin may still need to download full S2-level-6 tiles; limit fresh downloads explicitly.
2. QGIS output layers are GeoPackage/vector layers and are **not directly accepted** by MapAble's offline CSV staging script. The QGIS profile cache contains the original **headerless** Google CSV.gz tiles.
3. Select an individually approved source tile, verify it is within an authorised country and licence, record its SHA-256, and supply the small WKT AOI. In MapAble's `apps/web` run `python scripts/access/stage_open_buildings_v3.py --help` and follow `docs/access/GOOGLE_OPEN_BUILDINGS_V3_STAGING.md`.
4. Validate projected/centroid geometry and record counts independently in QGIS. Source model confidence means **building detection confidence only**. All staged candidates remain `AI_INFERRED_UNVERIFIED`, `eligibleForRouting: false`.
5. Obtain source-steward and human review before any import, API route, data refresh service, live navigation or geospatial database change.

### Release gate

**Do not** claim that QGIS is installed on Windows, that any genuine Google data has been downloaded, that source-footprint validation was completed or that live MapAble navigation has been enabled unless independently verified. Keep draft PR #11 separate from release approval.
