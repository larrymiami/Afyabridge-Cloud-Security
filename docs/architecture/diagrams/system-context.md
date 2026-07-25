# System Context Diagram

## 1. Purpose

This diagram shows the people and external systems that interact with the fictional AfyaBridge community-health platform. It deliberately avoids implementation details such as Cloud Run, GKE, databases, subnets, or specific Google Cloud projects.

The goal is to establish the business context and the highest-level trust relationships before creating detailed container, deployment, network, and data-flow diagrams.

## 2. System context

```mermaid
flowchart LR
    chw[Community Health Worker]
    supervisor[CHW Supervisor]
    facility[Facility Worker]
    countryAdmin[Country Programme Administrator]
    globalManager[Global Programme Manager]
    analyst[Data Analyst]
    platformEngineer[Platform Engineer]
    securityEngineer[Security Engineer]
    auditor[Auditor]

    afyaBridge[[AfyaBridge Community Health Platform]]

    identityProvider[Workforce and Application Identity Provider]
    notificationProvider[SMS and Messaging Provider]
    facilityDirectory[Facility Directory or Referral Partner]
    securityTicketing[Security Alerting and Ticketing System]
    sourceControl[GitHub Source Control and CI/CD]
    googleCloud[Google Cloud Platform]

    chw -->|Records visits, education and referrals| afyaBridge
    supervisor -->|Reviews teams and assigned regions| afyaBridge
    facility -->|Receives and updates referrals| afyaBridge
    countryAdmin -->|Administers one country programme| afyaBridge
    globalManager -->|Views aggregated de-identified metrics| afyaBridge
    analyst -->|Uses approved analytics datasets| afyaBridge
    platformEngineer -->|Operates infrastructure through approved workflows| afyaBridge
    securityEngineer -->|Reviews posture, alerts and incidents| afyaBridge
    auditor -->|Reviews selected evidence and logs| afyaBridge

    afyaBridge <-->|Authentication and identity lifecycle| identityProvider
    afyaBridge -->|Sends approved notifications| notificationProvider
    afyaBridge <-->|Facility and referral information| facilityDirectory
    afyaBridge -->|Security findings and incidents| securityTicketing

    sourceControl -->|Reviewed code, infrastructure and deployment workflows| googleCloud
    googleCloud -->|Hosts application, data and security services| afyaBridge

    classDef person fill:#ffffff,stroke:#333333,stroke-width:1px;
    classDef system fill:#f5f5f5,stroke:#111111,stroke-width:2px;
    classDef external fill:#ffffff,stroke:#666666,stroke-dasharray:5 5;

    class chw,supervisor,facility,countryAdmin,globalManager,analyst,platformEngineer,securityEngineer,auditor person;
    class afyaBridge system;
    class identityProvider,notificationProvider,facilityDirectory,securityTicketing,sourceControl,googleCloud external;
```

## 3. Primary actors

| Actor | Primary interaction | Security concern |
|---|---|---|
| Community Health Worker | Records visits and referrals | Device loss, account compromise, geographic overreach |
| CHW Supervisor | Reviews assigned teams | Excessive regional access |
| Facility Worker | Processes referrals | Exposure of unnecessary household data |
| Country Programme Administrator | Manages one country | Cross-country privilege escalation |
| Global Programme Manager | Reviews global metrics | Re-identification of aggregated data |
| Data Analyst | Queries approved datasets | Direct access to restricted operational data |
| Platform Engineer | Operates cloud services | Persistent privilege and change-control bypass |
| Security Engineer | Investigates findings | Excessive investigative access and evidence handling |
| Auditor | Reviews evidence | Unnecessary access to operational systems |

## 4. External systems

| External system | Purpose | Boundary consideration |
|---|---|---|
| Identity provider | Authenticates staff, partners, and application users | Federation, MFA, session lifecycle, claims integrity |
| SMS and messaging provider | Sends reminders and referral notifications | Data minimisation, provider credentials, delivery logs |
| Facility directory or referral partner | Shares approved facility and referral information | API trust, validation, availability, data-sharing rules |
| Security alerting and ticketing | Receives findings and incident records | Sensitive evidence, access control, retention |
| GitHub | Stores source and runs CI/CD | Supply-chain risk, branch protection, OIDC trust |
| Google Cloud | Hosts platform resources | IAM, network, posture, encryption, regional availability |

## 5. Highest-level trust boundaries

```mermaid
flowchart TB
    publicUsers[Field and Programme Users]

    subgraph PublicBoundary[Public and Partner Boundary]
        edge[Public Application Edge]
        externalProviders[Approved External Providers]
    end

    subgraph PlatformBoundary[AfyaBridge Platform Boundary]
        application[Application and API Services]
        data[Operational Data Services]
        analytics[De-identified Analytics Services]
    end

    subgraph OperationsBoundary[Engineering and Security Operations Boundary]
        cicd[Source Control and CI/CD]
        admin[Privileged Administration]
        monitoring[Logging, Posture and Incident Services]
    end

    publicUsers --> edge
    edge --> application
    externalProviders <--> application
    application --> data
    data --> analytics
    cicd --> application
    admin --> application
    admin --> data
    application --> monitoring
    data --> monitoring
    cicd --> monitoring
```

The detailed threat model will analyse each boundary independently.

## 6. Security assumptions represented by the diagram

1. Public users never connect directly to operational databases.
2. External providers communicate only through approved interfaces.
3. Analytics consumers use de-identified datasets rather than operational stores.
4. Production deployment originates from reviewed CI/CD workflows.
5. Privileged administration is separate from ordinary application use.
6. Logging and security monitoring receive events from both application and cloud layers.
7. Country isolation exists inside the platform even though it is not expanded in this context-level view.
8. Google Cloud is a hosting and control plane, not an implicit trust guarantee.

## 7. Follow-on diagrams

This context diagram will later be expanded into:

- application container diagram;
- Google Cloud resource hierarchy diagram;
- workforce, workload, and application identity diagram;
- secure network zoning diagram;
- country and environment isolation diagram;
- CI/CD and software supply-chain diagram;
- logging, posture, and incident-response diagram;
- data-flow and trust-boundary diagrams;
- multi-region deployment and failover diagram.
