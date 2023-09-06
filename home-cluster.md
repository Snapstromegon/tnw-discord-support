# Home Cluster Domain Setup

## Pure DNS Basis

```mermaid
graph LR
  Internet --DNS--> Reg[Domain Registry]
  Reg -->NSPro[Provider Nameserver]
  Reg -->NSLoc[Local Nameserver]
  subgraph Provider
    NSPro --> Mail & ProWebA[Website A] & ProWebB[Website B]
  end
  subgraph Local
    NSLoc --> Mail & LocWebA[Website A] & LocWebB[Website B] & Gitlab & Proxmox
  end
```

### Vorteile

- Braucht keinen VPS

### Nachteil

- Du kannst keinen Fallback für lokale Dienste machen, die sich nicht einfach synchronisieren lassen
- Du weißt nie, ob eine Anfrage an Website A lokal oder beim Provider geschickt wird
- DNS TTL

## Reverse Proxy

### DNS

```mermaid
graph LR
  Internet --DNS--> Reg[Domain Registry]
  Reg -->NSPro[Provider Nameserver]
  Reg -->NSLoc[Local Nameserver]
  subgraph VPS
    proxy[Reverse Proxy]
  end
  subgraph Provider
    NSPro --> proxy & Mail
    proxy -.-> ProWebA[Website A] & ProWebB[Website B]
  end
  subgraph Local
    NSLoc --> proxy & Mail
    proxy -.-> LocWebA[Website A] & LocWebB[Website B] & Gitlab & Proxmox
  end
```

### HTTP(S)

#### Lokaler Server OK

```mermaid
sequenceDiagram
  participant Browser
  participant Proxy
  participant LocWebA as Lokaler Server
  Browser->>Proxy: Gib Website A
  Proxy->>LocWebA: Gib Seite
  LocWebA->>Proxy: Hier, Seite!
  Proxy->>Browser: Hier, Seite!
```

#### Lokaler Server nicht OK

```mermaid
sequenceDiagram
  participant Browser
  participant Proxy
  participant LocWebA as Lokaler Server
  participant ProWebA as Provider Server
  Browser->>Proxy: Gib Website A
  Proxy->>LocWebA: Gib Seite
  LocWebA->>Proxy: FAIL
  Proxy->>ProWebA: Gib Seite
  ProWebA->>Proxy: Hier, Seite!
  Proxy->>Browser: Hier, Seite!
```

#### Exklusiv Lokaler Server nicht OK
```mermaid
sequenceDiagram
  participant Browser
  participant Proxy
  participant Gitlab
  Browser->>Proxy: Gib Website A
  Proxy->>Gitlab: Gib Seite
  Gitlab->>Proxy: FAIL
  Proxy->>Browser: FAIL
```

### Vorteile

- Du hast Kontrolle wo Aufrufe hin gehen
- Du kannst Fallback Seiten für lokale Dienste erstellen

### Nachteil

- VPS Kosten
- ALLE Anfragen gehen komplett durch den reverse proxy (heißt auch Anfragen aus deinem Netzwerk gehen erst ins Internet)