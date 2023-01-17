Flow chart of the counter

# Initialization
The code is run automatically when the script is parsed. This step defines common code used by all counters on the page.

```mermaid
flowchart TB
    subgraph GlobalStorage
      GS[Creates an empty storage and fills in some basic info. <br>The global storage is shared by all counter on a page. <br>It contains common data and allows intercounter communication, <br>e.g. register semaphores for actions that should be performed once for all counters.]
    end

    subgraph Mappings
      direction LR

      subgraph MD[Create mappings that define which sender/middleware/transport combination to use with each provider.]
      end

      subgraph ProviderMaps
        direction LR

        ProviderMap --> Sender
        ProviderMap --> ProviderMiddlewares
        ProviderMap --> Transports
      end

      subgraph SenderMaps
        direction LR
        
        SenderMap --> SenderMiddlewares
      end
    end

    subgraph CounterConstructor
      CC[The constructor function that starts a counter]
    end

    subgraph StaticMethods
      SM[Static counter methods not ties to a particular counter instance]
    end

    subgraph StackProxy
      SP[A handler of events from the proxy stack]
    end

    GlobalStorage --> Mappings
    Mappings --> CounterConstructor
    CounterConstructor --> StaticMethods
    StaticMethods --> StackProxy
```

# Constructor
The code run is triggered by a user: either calling the constructor (`new Ya.Metrika2(XXXXXX)`) or via proxy stack (`ym(XXXXXX, "init", {});`).

```mermaid
flowchart TB
  ParseOptions

  subgraph PrioritizedProviders
    PP[Anything that needs to be done <br>before the start and requires counter options.]
  end

  subgraph DebugConsole
  end

  subgraph BeforeHitProviders
    BHP[Sets info required before the first hit <br>or runs providers that need to track the first hit.]
  end

  subgraph Hit
    H[The first hit - pageview. Sent is ASAP. <br>The response comprises counter settings <br>which are saved for use by other providers.]
  end

  subgraph SynchronousProviders
    SP[The stuff that is not dependent on counter settings <br>and required to be run ASAP.]
  end

  subgraph CounterMethodsInitialization
    CMI[All the methods provided via JS API are registered on the counter instance.]
  end

  subgraph AsynchronousProviders
    ASP[The stuff that is dependent on counter settings <br>or is not essentially necessary to be run ASAP.]
  end

  ParseOptions --> PrioritizedProviders
  PrioritizedProviders --> DebugConsole
  DebugConsole --> BeforeHitProviders
  BeforeHitProviders --> Hit
  Hit --> SynchronousProviders
  SynchronousProviders --> CounterMethodsInitialization
  CounterMethodsInitialization --> AsynchronousProviders
```

# Request flow
Any request provider performs some initial actions:
- gathers data from page and browser;
- subscribes for user or DOM events;
- prepares data for further processing by a sender/middlewares.

Then a sender is called.

```mermaid
flowchart TB
  subgraph Provider
    P[Gathers some basic info or subscribes for future events.<br>Performs event data parsing and triggers a sender.]
  end

  subgraph Sender
    S[Sets basic request info, defines backend endpoint and the most common parameters.]
  end

  subgraph Middlewares
    M[Append the request data with any useful info.]
  end

  subgraph Transport
    T[Iterate through a set of transports until the request is successfully sent to the backend.]
  end

  Provider --> Sender
  Sender --> Middlewares
  Middlewares --> Transport

```
