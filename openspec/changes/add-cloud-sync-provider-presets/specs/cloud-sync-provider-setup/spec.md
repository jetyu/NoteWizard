## ADDED Requirements

### Requirement: WebDAV service preset selection
The system SHALL provide a service-provider dropdown on the WebDAV configuration page using the same interaction pattern as the AI provider dropdown, with options for Jianguoyun, Nextcloud, ownCloud, and custom WebDAV.

#### Scenario: Apply Jianguoyun preset
- **WHEN** the user selects Jianguoyun
- **THEN** the system sets the WebDAV URL to the official Jianguoyun WebDAV endpoint
- **AND** the system preserves the remote path, username, and password

#### Scenario: Select a self-hosted WebDAV service
- **WHEN** the user selects Nextcloud, ownCloud, or custom WebDAV
- **THEN** the system retains the common WebDAV URL and credential placeholders without storing an invalid template URL

### Requirement: Object-storage service preset selection
The system SHALL provide a service-provider dropdown on the object-storage configuration page with options for Alibaba Cloud OSS, Tencent Cloud COS, Amazon S3, Cloudflare R2, and custom S3-compatible storage.

#### Scenario: Apply a provider with known defaults
- **WHEN** the user selects Alibaba Cloud OSS, Tencent Cloud COS, or Amazon S3
- **THEN** the system applies that provider's recommended Endpoint and virtual-hosted addressing style
- **AND** the system clears Region and marks it as required so the user supplies the actual Bucket region
- **AND** the system preserves the remote path, Bucket, AccessKey ID, and Secret Key

#### Scenario: Apply Cloudflare R2
- **WHEN** the user selects Cloudflare R2
- **THEN** the system clears Region, uses virtual-hosted addressing, and leaves the account-specific Endpoint editable with the common object-storage prompt

#### Scenario: Select custom S3-compatible storage
- **WHEN** the user selects custom S3-compatible storage
- **THEN** the system preserves the custom Endpoint and existing addressing mode, clears Region for explicit input, and does not overwrite credentials

### Requirement: Official setup guidance
The system SHALL display an official setup-guide link for every known service provider and SHALL open it externally only when its HTTPS host is explicitly allowed by the Electron main process.

#### Scenario: Open an allowed guide
- **WHEN** the user activates a known provider's official guide link
- **THEN** the system opens the guide in the operating system browser and keeps the renderer on the configuration page

#### Scenario: Configure a custom provider
- **WHEN** the custom WebDAV or S3-compatible option is selected
- **THEN** the system does not display a provider-specific external guide link

### Requirement: Stable provider presentation
The system SHALL display a bundled local logo beside every provider label in both the dropdown trigger and options, and SHALL keep the trigger height stable when switching between Chinese and Latin-script labels.

#### Scenario: Switch between localized provider names
- **WHEN** the user switches between providers whose labels use different scripts
- **THEN** the selected provider logo and label update without shifting the surrounding form vertically

### Requirement: Required connection fields
The system SHALL use the shared red required indicator for every field included in the existing connection-readiness checks.

#### Scenario: View WebDAV configuration requirements
- **WHEN** the user opens the WebDAV configuration page
- **THEN** URL, username, and password are marked as required

#### Scenario: View object-storage configuration requirements
- **WHEN** the user opens the object-storage configuration page
- **THEN** Endpoint, Bucket, Region, Access Key, and Secret Key are marked as required
- **AND** the shared remote storage path is not marked because it has a non-empty normalized default

### Requirement: Sensitive configuration preservation
Applying a service preset MUST NOT clear or replace user credentials, Bucket names, or the remote storage path.

#### Scenario: Switch provider preset after entering credentials
- **WHEN** the user has entered credentials and selects another service preset
- **THEN** the credentials, Bucket, and remote storage path remain unchanged
